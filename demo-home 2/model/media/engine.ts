import type { MediaConfig, MediaNode, MediaZone, SourceKind } from './types.ts';

// Движок медиа: то, что в старом доме было размазано между сервером сценариев, JS панели и SIMPL.
//  - пути от источника до зоны ищутся по графу кабелей, а не прописаны в switch по имени комнаты;
//  - у источника есть аренда (кто смотрит), конфликт отдаётся как выбор: смотреть вместе, другой экземпляр, перехватить;
//  - переход — план шагов с калиброванными временами; прогресс считается по плану, план можно отменить;
//  - зоны с общим оборудованием (кинотеатр ↔ гостиная) передают сессию, а не выключают источник;
//  - мультирум — это просто аудиоисточник, у которого несколько зон.

export type Activity = 'watch' | 'listen' | 'tv';
export type Claims = Record<string, string>; // "mx:o2" → "in6", "tv-kitchen:in" → "hdmi1"

export interface Content { kind: 'movie' | 'episode' | 'channel' | 'radio' | 'track' | 'app'; id: string; title: string; sub?: string; art: string; dur?: number; pos?: number }

export interface Step { id: string; label: string; start: number; dur: number; done?: boolean; apply?: () => void }
export interface Plan { kind: 'start' | 'stop' | 'restart'; steps: Step[]; total: number; elapsed: number; title: string }

export interface Session { activity: Activity; source: string; claims: Claims; devices: string[]; shared?: boolean }
export interface ZoneState { session?: Session; plan?: Plan; volume: number; muted: boolean; note?: string }

export interface DeviceState { power: 'off' | 'booting' | 'on' | 'cooling'; coolUntil?: number; input?: string; pos?: number }

export interface SourceState { owner?: string; zones: string[]; content?: Content; playing: boolean; restarting?: Plan }

export type Option =
  | { type: 'share'; source: string; with: string; label: string }
  | { type: 'other'; source: string; label: string }
  | { type: 'takeover'; source: string; from: string; label: string };
export interface Conflict { zone: string; wanted: string; message: string; options: Option[] }

export interface Request { activity: Activity; source?: string; kind?: SourceKind; content?: Content }

const nodeTiming = (n: MediaNode) => n.timing ?? {};

export class MediaEngine {
  cfg: MediaConfig;
  now = 0;
  nodes: Record<string, MediaNode>;
  zones: Record<string, MediaZone>;
  dev: Record<string, DeviceState> = {};
  src: Record<string, SourceState> = {};
  zone: Record<string, ZoneState> = {};
  log: { t: number; text: string; zone?: string }[] = [];
  private seq = 0;

  constructor(cfg: MediaConfig) {
    this.cfg = cfg;
    this.nodes = Object.fromEntries(cfg.nodes.map(n => [n.id, n]));
    this.zones = Object.fromEntries(cfg.zones.map(z => [z.id, z]));
    for (const n of cfg.nodes) this.dev[n.id] = { power: 'off', pos: n.role === 'screen' ? 0 : undefined };
    for (const n of cfg.nodes.filter(n => n.role === 'source' || n.kind === 'smarttv')) this.src[n.id] = { zones: [], playing: false };
    for (const z of cfg.zones) this.zone[z.id] = { volume: 30, muted: false };
  }

  // ——— граф ———

  /** Путь сигнала от узла до цели (узел и порт или любой вход узла) с выборами на коммутаторах. */
  private route(from: string, outPort: string | null, target: { node: string; port?: string }, base: Claims, audio: boolean, held: Claims = {}): Claims | null {
    type St = { node: string; claims: Claims; via: string | null };
    const start: St[] = [];
    const outs = outPort ? [outPort] : [...(this.nodes[from].outs ?? []), ...(this.nodes[from].audioOuts ?? [])];
    for (const o of outs) start.push({ node: from, claims: { ...base }, via: o });
    const q: { at: [string, string]; claims: Claims; depth: number }[] = [];
    const push = (s: St) => { for (const l of this.cfg.links) if (l.from[0] === s.node && l.from[1] === s.via) q.push({ at: l.to, claims: s.claims, depth: 0 }); };
    // смарт-ТВ как источник: стартуем «внутри» телевизора
    if (!outPort && this.nodes[from].role === 'display') {
      const c = { ...base, [`${from}:in`]: 'tv' };
      if (base[`${from}:in`] && base[`${from}:in`] !== 'tv') return null;
      if (target.node === from && (!target.port || target.port === 'spk')) return c;
      for (const o of this.nodes[from].audioOuts ?? []) push({ node: from, claims: c, via: o });
    } else start.forEach(push);
    // выбор на коммутаторе, занятый другой зоной под другой сигнал, не трогаем — ищем другой путь
    const set = (c: Claims, k: string, v: string) => ((c[k] && c[k] !== v) || (held[k] && held[k] !== v) ? null : { ...c, [k]: v });
    while (q.length) {
      const { at: [node, port], claims, depth } = q.shift()!;
      if (depth > 8) continue;
      const n = this.nodes[node];
      if (node === target.node && !target.port) return set(claims, `${node}:in`, port);
      if (n.role === 'matrix' || n.role === 'amp') {
        for (const o of [...(n.outs ?? []), ...(audio ? n.audioOuts ?? [] : [])]) {
          const c = set(claims, `${node}:${o}`, port); if (!c) continue;
          if (node === target.node && o === target.port) return c;
          for (const l of this.cfg.links) if (l.from[0] === node && l.from[1] === o) q.push({ at: l.to, claims: c, depth: depth + 1 });
        }
      } else if (n.role === 'avr' || n.role === 'display') {
        const c = set(claims, `${node}:in`, port); if (!c) continue;
        if (node === target.node && target.port) return c;
        for (const o of [...(n.outs ?? []), ...(n.audioOuts ?? [])]) {
          if (!audio && (n.audioOuts ?? []).includes(o)) continue;
          for (const l of this.cfg.links) if (l.from[0] === node && l.from[1] === o) q.push({ at: l.to, claims: c, depth: depth + 1 });
        }
      }
    }
    return null;
  }

  /** Как источник попадает в зону: картинка и звук. null — недостижим. */
  /** Выборы коммутаторов, которые держат другие зоны (кроме зон с общим оборудованием). */
  held(zoneId: string): Claims {
    const z = this.zones[zoneId];
    const out: Claims = {};
    for (const [id, st] of Object.entries(this.zone)) if (id !== zoneId && !z.sharesWith?.includes(id) && st.session) Object.assign(out, st.session.claims);
    return out;
  }

  pathFor(zoneId: string, sourceId: string): Claims | null {
    const z = this.zones[zoneId], s = this.nodes[sourceId];
    const held = this.held(zoneId);
    const isTv = s.role === 'display';
    if (isTv && sourceId !== z.display) return null;
    let claims: Claims = {};
    if (s.video && !isTv) {
      if (!z.display) return null;
      const v = this.route(sourceId, s.outs![0], { node: z.display }, claims, false, held);
      if (!v) return null;
      claims = v;
    }
    const a = this.route(sourceId, isTv ? null : s.outs![0], { node: z.audio[0], port: z.audio[1] }, claims, true, held);
    return a;
  }

  /** Что можно делать в зоне — выводится из графа. */
  options(zoneId: string) {
    const z = this.zones[zoneId];
    const list = Object.keys(this.src).filter(id => this.pathFor(zoneId, id));
    return {
      watch: list.filter(id => this.nodes[id].video && this.nodes[id].role === 'source'),
      listen: list.filter(id => !this.nodes[id].video && this.nodes[id].role === 'source'),
      tv: z.display && this.nodes[z.display].kind === 'smarttv' ? z.display : undefined
    };
  }

  devicesOf(zoneId: string, sourceId: string, claims: Claims) {
    const z = this.zones[zoneId];
    const set = new Set<string>([sourceId]);
    for (const k of Object.keys(claims)) set.add(k.split(':')[0]);
    if (z.display && this.nodes[sourceId].video) set.add(z.display);
    if (z.screen && z.display === 'pj') set.add(z.screen);
    set.add(z.audio[0]);
    return [...set];
  }

  // ——— запросы ———

  request(zoneId: string, r: Request): { ok: true } | { conflict: Conflict } {
    const z = this.zones[zoneId];
    let sourceId = r.source;
    if (r.activity === 'tv') sourceId = z.display;
    if (!sourceId && r.kind) {
      const inst = this.options(zoneId)[r.activity === 'listen' ? 'listen' : 'watch'].filter(id => this.nodes[id].kind === r.kind);
      const mine = inst.find(id => this.src[id].zones.some(x => x === zoneId || z.sharesWith?.includes(x)));
      const free = inst.find(id => !this.src[id].zones.length && !this.src[id].restarting);
      sourceId = mine ?? free;
      if (!sourceId) {
        return { conflict: this.conflictFor(zoneId, inst, r.kind === 'streamer' ? 'Оба стримера заняты' : `Все ${this.kindName(r.kind)} заняты`) };
      }
    }
    if (!sourceId) throw new Error('нет источника');
    const st = this.src[sourceId];
    const others = st.zones.filter(x => x !== zoneId && !z.sharesWith?.includes(x));
    if (others.length && this.nodes[sourceId].role === 'source' && !r.content) {
      const inst = this.options(zoneId).watch.concat(this.options(zoneId).listen).filter(id => this.nodes[id].kind === this.nodes[sourceId!].kind);
      return { conflict: this.conflictFor(zoneId, inst, `${this.nodes[sourceId].name} сейчас ${this.where(others[0])}`) };
    }
    this.start(zoneId, sourceId, r.activity, r.content, false);
    return { ok: true };
  }

  private where(zoneId: string) { return `в зоне «${this.zones[zoneId].name}»`; }
  private kindName(k: SourceKind) { return { appletv: 'Apple TV', kodi: 'Kodi', sat: 'тюнеры', streamer: 'стримеры', smarttv: 'телевизоры' }[k]; }

  private conflictFor(zoneId: string, instances: string[], message: string): Conflict {
    const options: Option[] = [];
    const free = instances.find(id => !this.src[id].zones.length);
    if (free) options.push({ type: 'other', source: free, label: `Включить ${this.nodes[free].name} — свободен` });
    for (const id of instances) {
      const owner = this.src[id].zones[0];
      if (!owner) continue;
      const what = this.src[id].content?.title;
      options.push({ type: 'share', source: id, with: owner, label: `${this.nodes[id].kind === 'streamer' ? 'Слушать' : 'Смотреть'} вместе с зоной «${this.zones[owner].name}»${what ? ` · ${what}` : ''}` });
    }
    for (const id of instances) {
      const owner = this.src[id].zones[0];
      if (owner) options.push({ type: 'takeover', source: id, from: owner, label: `Забрать ${this.nodes[id].name} у зоны «${this.zones[owner].name}»` });
    }
    return { zone: zoneId, wanted: instances[0], message, options };
  }

  resolve(c: Conflict, o: Option, activity: Activity = 'watch') {
    if (o.type === 'takeover') {
      this.stop(o.from, `${this.nodes[o.source].name} забрали в зону «${this.zones[c.zone].name}»`);
      this.start(c.zone, o.source, activity, undefined, false);
    } else this.start(c.zone, o.source, activity, undefined, o.type === 'share');
  }

  // ——— планы ———

  private step(label: string, start: number, dur: number, apply?: () => void): Step {
    return { id: `s${++this.seq}`, label, start, dur, apply };
  }

  private start(zoneId: string, sourceId: string, activity: Activity, content: Content | undefined, shared: boolean) {
    const z = this.zones[zoneId];
    const claims = this.pathFor(zoneId, sourceId);
    if (!claims) throw new Error(`нет пути ${sourceId} → ${zoneId}`);
    const prev = this.zone[zoneId].session;
    const devices = this.devicesOf(zoneId, sourceId, claims);
    const reuse = new Set(devices);
    // зоны с общим оборудованием: передача сессии (ТВ → проектор без выключения источника)
    for (const other of z.sharesWith ?? []) if (this.zone[other].session) this.release(other, true, `Перенесено в зону «${z.name}»`, reuse);
    if (prev) this.release(zoneId, true, undefined, reuse);
    const steps: Step[] = [];
    const ready: Record<string, number> = {};
    for (const id of devices) {
      const n = this.nodes[id], d = this.dev[id], t = nodeTiming(n);
      if (n.role === 'screen') {
        if ((d.pos ?? 0) < 100) steps.push(this.step('Опускаем экран', 0, t.travel ?? 20, () => (d.pos = 100)));
        continue;
      }
      if (d.power === 'on' || d.power === 'booting') { ready[id] = 0; continue; }
      let at = 0;
      if (d.power === 'cooling') {
        const left = Math.max(0, Math.ceil((d.coolUntil ?? 0) - this.now));
        if (left) { steps.push(this.step(`${n.name}: остывает после выключения`, 0, left)); at = left; }
      }
      const boot = t.boot ?? 1;
      d.power = 'booting';
      steps.push(this.step(`Включаем: ${n.name}`, at, boot, () => { d.power = 'on'; }));
      ready[id] = at + boot;
    }
    for (const [k, v] of Object.entries(claims)) {
      const [node, port] = k.split(':');
      const n = this.nodes[node];
      const cur = port === 'in' ? this.dev[node].input : (this.dev[node] as any)[`r_${port}`];
      if (cur === v && this.dev[node].power === 'on') continue;
      const label = n.role === 'matrix' ? `Матрица: ${port} ← ${this.nameOfInput(node, v)}`
        : n.role === 'amp' ? `Усилитель: зона ${port.slice(1)} ← ${this.nameOfInput(node, v)}`
        : `${n.name}: вход ${v === 'tv' ? 'ТВ' : v.toUpperCase()}`;
      const at = ready[node] ?? 0;
      steps.push(this.step(label, at, nodeTiming(n).input ?? 1, () => { if (port === 'in') this.dev[node].input = v; else (this.dev[node] as any)[`r_${port}`] = v; }));
    }
    const s = this.src[sourceId];
    if (!s.zones.includes(zoneId)) s.zones.push(zoneId);
    s.owner ??= zoneId;
    if (content) { s.content = { ...content, pos: content.pos ?? 0 }; s.playing = true; }
    else if (!s.content) s.content = this.defaultContent(sourceId);
    const plan = this.plan('start', steps, `${this.nodes[sourceId].role === 'display' ? 'Телевизор' : this.nodes[sourceId].name} → ${z.name}`);
    this.zone[zoneId].session = { activity, source: sourceId, claims, devices, shared };
    this.zone[zoneId].plan = plan.total ? plan : undefined;
    if (!plan.total) s.playing = true;
    this.note(zoneId, shared ? `${activity === 'listen' ? 'Слушает' : 'Смотрит'} вместе с зоной «${this.zones[s.zones[0]].name}»` : undefined);
    this.say(`${z.name}: ${plan.title}${plan.total ? `, ${Math.ceil(plan.total)} с` : ''}`, zoneId);
  }

  private nameOfInput(node: string, port: string) {
    const l = this.cfg.links.find(l => l.to[0] === node && l.to[1] === port);
    return l ? this.nodes[l.from[0]].name : port;
  }

  private plan(kind: Plan['kind'], steps: Step[], title: string): Plan {
    return { kind, steps, title, elapsed: 0, total: steps.reduce((m, s) => Math.max(m, s.start + s.dur), 0) };
  }

  /** Освободить зону; keep — передача сессии: источник и общий ресивер остаются включены. */
  private release(zoneId: string, keep: boolean, why?: string, reuse = new Set<string>()) {
    const ses = this.zone[zoneId].session;
    if (!ses) return;
    this.zone[zoneId].session = undefined;
    this.zone[zoneId].plan = undefined;
    const s = this.src[ses.source];
    s.zones = s.zones.filter(x => x !== zoneId);
    if (s.owner === zoneId) s.owner = s.zones[0];
    if (why) this.note(zoneId, why);
    const busy = new Set(Object.values(this.zone).flatMap(z => z.session?.devices ?? []));
    const steps: Step[] = [];
    for (const id of ses.devices) {
      if (busy.has(id) || reuse.has(id)) continue;
      const n = this.nodes[id], d = this.dev[id], t = nodeTiming(n);
      if (n.role === 'screen') { steps.push(this.step('Поднимаем экран', 0, t.travel ?? 20, () => (d.pos = 0))); continue; }
      if (n.role === 'source' || n.role === 'matrix') { if (n.role === 'source' && !s.zones.length) { d.power = 'off'; s.playing = false; } continue; }
      if (d.power === 'off' || d.power === 'cooling') continue;
      if (t.cool) { d.power = 'cooling'; d.coolUntil = this.now + t.cool; d.input = undefined; continue; }
      else { steps.push(this.step(`Выключаем: ${n.name}`, 0, 1, () => { d.power = 'off'; d.input = undefined; })); }
    }
    // своя зона показывает прогресс выключения; при передаче и смене источника — фоном
    if (steps.length && !keep) this.zone[zoneId].plan = this.plan('stop', steps, `Выключаем: ${this.zones[zoneId].name}`);
    else if (steps.length) this.background.push(this.plan('stop', steps, 'фон'));
  }
  private background: Plan[] = [];

  stop(zoneId: string, why?: string) {
    const ses = this.zone[zoneId].session;
    if (!ses) return;
    this.release(zoneId, false, why);
    this.say(`${this.zones[zoneId].name}: выключено${why ? ` · ${why}` : ''}`, zoneId);
  }

  cancel(zoneId: string) {
    const p = this.zone[zoneId].plan;
    if (p?.kind === 'start') this.stop(zoneId, 'включение отменено');
  }

  stopAll() { for (const id of Object.keys(this.zone)) this.stop(id); }

  /** Перезапуск зависшего источника через его розетку PDU — штатное действие, а не обходной запрос из панели. */
  restart(sourceId: string) {
    const n = this.nodes[sourceId], s = this.src[sourceId], d = this.dev[sourceId];
    if (!n.outlet) return;
    s.playing = false;
    s.restarting = this.plan('restart', [
      this.step(`Розетка ${n.outlet}: отключаем питание`, 0, 5, () => { d.power = 'off'; }),
      this.step(`Загрузка: ${n.name}`, 5, n.kind === 'kodi' ? 40 : 25, () => { d.power = 'on'; s.playing = !!s.content; })
    ], `Перезапуск: ${n.name}`);
    this.say(`Перезапуск: ${n.name}`);
  }

  // ——— воспроизведение ———

  play(zoneId: string, content: Content) {
    const ses = this.zone[zoneId].session;
    if (!ses) return this.request(zoneId, { activity: content.kind === 'radio' || content.kind === 'track' ? 'listen' : 'watch', kind: this.kindFor(content), content });
    const s = this.src[ses.source];
    s.content = { ...content, pos: content.pos ?? 0 };
    s.playing = true;
    return { ok: true as const };
  }
  private kindFor(c: Content): SourceKind { return c.kind === 'channel' ? 'sat' : c.kind === 'radio' || c.kind === 'track' ? 'streamer' : c.kind === 'app' ? 'appletv' : 'kodi'; }

  toggle(zoneId: string) { const ses = this.zone[zoneId].session; if (ses) this.src[ses.source].playing = !this.src[ses.source].playing; }
  seek(zoneId: string, d: number) { const c = this.cur(zoneId)?.content; if (c?.dur) c.pos = Math.max(0, Math.min(c.dur, (c.pos ?? 0) + d)); }
  setVolume(zoneId: string, v: number) {
    const key = this.zones[zoneId].audio.join(':');
    for (const z of this.cfg.zones) if (z.audio.join(':') === key) this.zone[z.id].volume = v; // общий ресивер — общая громкость
  }
  mute(zoneId: string) { this.zone[zoneId].muted = !this.zone[zoneId].muted; }
  cur(zoneId: string) { const ses = this.zone[zoneId].session; return ses ? this.src[ses.source] : undefined; }

  joinable(zoneId: string) {
    const o = this.options(zoneId).listen;
    return o.filter(id => this.src[id].zones.length && !this.src[id].zones.includes(zoneId));
  }
  join(zoneId: string, sourceId: string) { this.start(zoneId, sourceId, 'listen', undefined, true); }

  defaultContent(id: string): Content {
    const n = this.nodes[id];
    if (n.kind === 'appletv') return { kind: 'app', id: 'home', title: 'Главный экран', sub: n.name, art: 'appletv' };
    if (n.kind === 'kodi') return { kind: 'app', id: 'home', title: 'Медиатека Kodi', sub: n.name, art: 'kodi' };
    if (n.kind === 'sat') return { kind: 'channel', id: 'ch1', title: 'Канал 1', sub: n.name, art: 'sat' };
    if (n.kind === 'smarttv') return { kind: 'app', id: 'tv', title: 'Смарт-ТВ', sub: n.name, art: 'tv' };
    return { kind: 'radio', id: 'idle', title: 'Тишина', sub: n.name, art: 'radio' };
  }

  // ——— время ———

  tick(dt: number) {
    this.now += dt;
    const run = (p: Plan) => {
      p.elapsed += dt;
      for (const s of p.steps) if (!s.done && p.elapsed >= s.start + s.dur) { s.done = true; s.apply?.(); }
      return p.elapsed >= p.total;
    };
    for (const [id, z] of Object.entries(this.zone)) if (z.plan && run(z.plan)) {
      const done = z.plan; z.plan = undefined;
      if (done.kind === 'start' && z.session) { this.src[z.session.source].playing = true; this.say(`${this.zones[id].name}: готово`, id); }
    }
    this.background = this.background.filter(p => !run(p));
    for (const s of Object.values(this.src)) {
      if (s.restarting && run(s.restarting)) s.restarting = undefined;
      if (s.playing && s.content?.dur) { s.content.pos = (s.content.pos ?? 0) + dt; if (s.content.pos >= s.content.dur) { s.content.pos = s.content.dur; s.playing = false; } }
    }
    for (const d of Object.values(this.dev)) if (d.power === 'cooling' && (d.coolUntil ?? 0) <= this.now) d.power = 'off';
  }

  private note(zoneId: string, text?: string) { this.zone[zoneId].note = text; }
  private say(text: string, zone?: string) { this.log.unshift({ t: this.now, text, zone }); this.log.length = Math.min(this.log.length, 40); }
}
