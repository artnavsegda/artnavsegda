import type { Command, DeviceState, HomeEvent, HomeState, SecurityMode, ServerMsg, Suggestion, Transport } from './types';
import { house, deviceById } from './house';

// Симулятор дома. Ведёт себя как настоящее ядро: отвечает с задержкой,
// диммеры доводит плавно, шторы едут секундами, климат медленно догоняет
// уставку, пылесос убирает и возвращается на базу, камеры ловят движение.
// Клиент получает только snapshot и delta — как по WebSocket.

const pad = (n: number) => String(n).padStart(2, '0');
const hhmm = (d = new Date()) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
const ago = (min: number) => hhmm(new Date(Date.now() - min * 60000));
const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

interface Fade { path: string; from: number; to: number; start: number; dur: number }

const extraScenes: Record<string, { name: string; set: Record<string, Partial<DeviceState>> }> = {
  'living-shades-50': { name: 'Шторы на 50%', set: { 'living.shades': { position: 50 } } }
};

const modeName: Record<SecurityMode, string> = { disarmed: 'снята', perimeter: 'периметр', full: 'полная' };

export class HouseSim implements Transport {
  state: HomeState;
  private subs = new Set<(m: ServerMsg) => void>();
  private pending = new Map<string, unknown>();
  private scheduled = false;
  private fades = new Map<string, Fade>();
  private evId = 1;
  private walkClock = 0;
  private night: boolean;

  constructor() {
    const h = new Date().getHours();
    this.night = h >= 18 || h < 7;
    const devices: Record<string, DeviceState> = {};
    for (const d of house.devices) {
      const s: DeviceState = {};
      if (d.caps.includes('dimmer')) Object.assign(s, { on: false, level: 0 });
      if (d.caps.includes('colorTemp')) s.ct = 2700;
      if (d.caps.includes('shade')) s.position = 100;
      if (d.caps.includes('climate')) Object.assign(s, { current: 21.6, target: 22.5, mode: 'heat', humidity: 41 });
      if (d.caps.includes('media')) Object.assign(s, { on: this.night, playing: this.night, title: 'Вечерний фильм', source: 'Apple TV', progress: 0.38, volume: 42 });
      if (d.caps.includes('speaker')) Object.assign(s, { playing: !this.night, title: 'Дневной плейлист', volume: 25 });
      if (d.caps.includes('vacuum')) Object.assign(s, { status: this.night ? 'docked' : 'cleaning', battery: this.night ? 100 : 71, cleaned: this.night ? 0 : 18 });
      if (d.caps.includes('floorHeat')) Object.assign(s, { on: true, current: 27, target: 27 });
      if (d.caps.includes('pool')) Object.assign(s, { on: this.night, temp: 27 });
      if (d.caps.includes('occupancy')) s.motion = false;
      if (d.caps.includes('fan')) s.on = false;
      if (d.caps.includes('fireplace')) Object.assign(s, { on: false, level: 60 });
      if (d.caps.includes('glass')) s.on = false;
      if (d.caps.includes('lock')) s.locked = true;
      // ИК без обратной связи, разница температур по комнатам и т.п. — из конфигурации объекта
      if (d.init) Object.assign(s, structuredClone(d.init));
      devices[d.id] = s;
    }

    const scene = this.night ? 'evening' : 'day';
    for (const [id, patch] of Object.entries(house.scenes.find(s => s.id === scene)!.set)) Object.assign(devices[id], patch);

    const events: HomeEvent[] = (this.night ? [
      ['Сцена «Вечер»', 'гостиная, кухня', 'scene', 4], ['Торшер', 'включён вручную', 'info', 31],
      ['Охрана: периметр', 'автоматически по расписанию', 'security', 88], ['Ворота', 'въезд, номер распознан', 'info', 160],
      ['Шторы', 'закрыты по закату', 'info', 210]
    ] : [
      ['Курьер у ворот', 'камера въезда', 'warn', 3], ['Пылесос', 'начал уборку кухни', 'info', 40],
      ['Окна спальни', 'открыты, проветривание', 'info', 135], ['Охрана снята', 'Face ID', 'security', 280],
      ['Утро', 'шторы открыты по солнцу', 'scene', 330]
    ]).map(([title, text, kind, m]) => ({ id: this.evId++, time: ago(m as number), title: title as string, text: text as string, kind: kind as HomeEvent['kind'] }));

    this.state = {
      devices,
      presence: { ...(this.night ? house.presence.night : house.presence.day) },
      walker: null,
      security: {
        mode: this.night ? 'perimeter' : 'disarmed', since: this.night ? ago(88) : ago(280),
        zones: Object.fromEntries(house.zones.map(z => [z.id, !this.night && (z.id === 'windows' || z.id === 'windows2') ? 'open' : 'ok'])) as HomeState['security']['zones']
      },
      events,
      scene,
      roomScene: { living: this.night ? 'living-evening' : '' },
      power: 0,
      outside: this.night ? -3 : 2,
      suggestion: null,
      cameras: Object.fromEntries(house.cameras.map(c => [c.id, false])),
      night: this.night
    };
    this.state.suggestion = this.suggestionFor(scene);
    this.state.power = this.computePower();
    setInterval(() => this.fastTick(), 50);
    setInterval(() => this.slowTick(), 1000);
    setTimeout(() => this.randomEvent(), 25000);
  }

  // ——— Transport ———
  subscribe(fn: (m: ServerMsg) => void) {
    this.subs.add(fn);
    queueMicrotask(() => fn({ type: 'snapshot', state: structuredClone(this.state) }));
    return () => { this.subs.delete(fn); };
  }

  send(c: Command): Promise<void> {
    const latency = 70 + Math.random() * 140;
    return new Promise(res => setTimeout(() => { this.apply(c); res(); }, latency));
  }

  // ——— state plumbing ———
  private set(path: string, value: unknown) {
    const keys = path.split('.');
    let o: any = this.state;
    for (let i = 0; i < keys.length - 1; i++) o = o[keys[i]] ??= {};
    if (o[keys[keys.length - 1]] === value) return;
    o[keys[keys.length - 1]] = value;
    this.pending.set(path, value);
    if (!this.scheduled) { this.scheduled = true; queueMicrotask(() => this.flush()); }
  }
  private flush() {
    this.scheduled = false;
    if (!this.pending.size) return;
    const changes = [...this.pending.entries()].map(([p, v]) => [p, typeof v === 'object' && v ? structuredClone(v) : v] as [string, unknown]);
    this.pending.clear();
    for (const fn of this.subs) fn({ type: 'delta', changes });
  }
  /** Устройство: device id содержит точку, поэтому путь собираем через «|». */
  private dset(id: string, key: keyof DeviceState, value: unknown) {
    const dev = this.state.devices[id] as any;
    if (dev[key] === value) return;
    dev[key] = value;
    this.pending.set(`devices|${id}|${key}`, value);
    if (!this.scheduled) { this.scheduled = true; queueMicrotask(() => this.flush()); }
  }
  private fadeTo(id: string, key: 'level' | 'position', to: number, dur: number) {
    const from = (this.state.devices[id] as any)[key] ?? 0;
    if (from === to) return;
    this.fades.set(`${id}|${key}`, { path: id, from, to, start: performance.now(), dur });
    if (key === 'level' && to > 0) this.dset(id, 'on', true);
  }
  private event(title: string, text: string, kind: HomeEvent['kind'] = 'info') {
    const ev = { id: this.evId++, time: hhmm(), title, text, kind };
    this.set('events', [ev, ...this.state.events].slice(0, 12));
  }

  // ——— commands ———
  private apply(c: Command) {
    switch (c.cmd) {
      case 'light.set': {
        if (c.ct !== undefined) this.dset(c.target, 'ct', c.ct);
        if (c.level !== undefined) this.fadeTo(c.target, 'level', Math.max(0, Math.min(100, Math.round(c.level))), 700);
        if (c.on !== undefined) {
          const d = this.state.devices[c.target];
          if (c.on) this.fadeTo(c.target, 'level', d.level && d.level > 0 ? d.level : 70, 600);
          else this.fadeTo(c.target, 'level', 0, 600);
        }
        this.set(`roomScene.${deviceById[c.target]?.room}`, '');
        break;
      }
      case 'shade.set': this.fadeTo(c.target, 'position', c.position, 2600); break;
      case 'climate.set':
        if (c.target_c !== undefined) this.dset(c.target, 'target', Math.round(c.target_c * 2) / 2);
        if (c.mode) this.dset(c.target, 'mode', c.mode);
        break;
      case 'media.action': {
        const d = this.state.devices[c.target];
        if (c.action === 'toggle') this.dset(c.target, 'playing', !d.playing);
        if (c.action === 'power') { this.dset(c.target, 'on', !d.on); this.dset(c.target, 'playing', !d.on); }
        if (c.action === 'vol') this.dset(c.target, 'volume', Math.max(0, Math.min(80, (d.volume ?? 30) + (c.delta ?? 2))));
        break;
      }
      case 'vacuum.action':
        this.dset(c.target, 'status', c.action === 'start' ? 'cleaning' : 'returning');
        this.event('Пылесос', c.action === 'start' ? 'начал уборку' : 'возвращается на базу');
        break;
      case 'scene.run': this.runScene(c.scene, c.room); break;
      case 'security.arm': this.arm(c.mode, true); break;
      case 'demo.event': this.demoEvent(c.kind); break;
      case 'device.set':
        if (c.on !== undefined) this.dset(c.target, 'on', c.on);
        if (c.locked !== undefined) { this.dset(c.target, 'locked', c.locked); this.event(c.locked ? 'Дверь заперта' : 'Дверь открыта', 'из приложения', 'security'); }
        if (c.level !== undefined) this.dset(c.target, 'level', c.level);
        break;
      case 'demo.time': {
        // демо-пульт: перевести дом в другое время суток
        this.night = c.night;
        this.set('night', c.night);
        this.set('outside', c.night ? -3 : 2);
        this.runScene(c.night ? 'evening' : 'day');
        if (!c.night) this.dset('living.speaker', 'playing', true);
        break;
      }
    }
    this.set('power', this.computePower());
  }

  private runScene(id: string, room?: string) {
    const def = room ? house.roomScenes[room]?.find(s => s.id === id) : (house.scenes.find(s => s.id === id) ?? extraScenes[id]);
    if (!def) return;
    let i = 0;
    for (const [dev, patch] of Object.entries(def.set)) {
      const p = patch as DeviceState;
      // небольшой каскад: группы света разгораются по очереди
      const delay = i++ * 70;
      setTimeout(() => {
        if (p.ct !== undefined) this.dset(dev, 'ct', p.ct);
        if (p.level !== undefined) this.fadeTo(dev, 'level', p.level, 1400);
        if (p.position !== undefined) this.fadeTo(dev, 'position', p.position, 3000);
        if (p.on !== undefined && p.level === undefined) this.dset(dev, 'on', p.on);
        if (p.locked !== undefined) this.dset(dev, 'locked', p.locked);
        if (p.playing !== undefined) this.dset(dev, 'playing', p.playing);
      }, delay);
    }
    if (room) {
      this.set(`roomScene.${room}`, id);
      this.event(`Сцена «${def.name}»`, house.rooms.find(r => r.id === room)?.name.toLowerCase() ?? '', 'scene');
    } else {
      if (house.scenes.find(s => s.id === id)) this.set('scene', id);
      this.set('roomScene.living', id === 'evening' ? 'living-evening' : id === 'cinema' ? 'living-cinema' : '');
      this.event(`Сцена «${def.name}»`, 'весь дом', 'scene');
      const arm = (def as any).arm as SecurityMode | undefined;
      if (arm) this.arm(arm, false);
      else if (id === 'day' || id === 'guests' || id === 'evening') { if (this.state.security.mode === 'full') this.arm('disarmed', false); }
      if (id === 'away') { this.set('presence', {}); }
      else if (Object.keys(this.state.presence).length === 0) this.set('presence', { ...(this.night ? house.presence.night : house.presence.day) });
    }
    this.set('suggestion', this.suggestionFor(id));
  }

  private arm(mode: SecurityMode, log: boolean) {
    this.set('security', { ...this.state.security, mode, since: hhmm() });
    if (log || true) this.event(mode === 'disarmed' ? 'Охрана снята' : `Охрана: ${modeName[mode]}`, log ? 'с панели · PIN' : 'по сцене', 'security');
  }

  private suggestionFor(scene: string): Suggestion | null {
    if (this.night && (scene === 'evening' || scene === 'cinema' || scene === 'guests'))
      return { id: 'sleep', title: 'Подготовить дом ко сну?', text: 'Выключу свет внизу, закрою шторы и поставлю периметр под охрану. В детской останется ночник.', action: { label: 'Режим «Ночь»', scene: 'night' } };
    if (!this.night && scene === 'day' && (this.state?.devices?.['living.shades']?.position ?? 100) > 60)
      return { id: 'sun', title: 'Солнце нагревает гостиную', text: 'Через час там будет 24,5°. Прикрыть шторы наполовину, чтобы не включать охлаждение?', action: { label: 'Шторы на 50%', scene: 'living-shades-50' } };
    return null;
  }

  private demoEvent(kind: 'doorbell' | 'motion' | 'leak-test') {
    if (kind === 'doorbell') {
      this.event('Звонок в дверь', 'входная группа · курьер', 'warn');
      this.flashCamera('entrance', 'door');
    } else if (kind === 'motion') {
      this.event('Движение на террасе', 'камера террасы · человек 92%', 'warn');
      this.flashCamera('terrace', 'terrace');
    } else {
      this.event('Проверка датчика протечки', 'ванная · норма', 'info');
    }
  }
  private flashCamera(cam: string, zone: string) {
    if (!(cam in this.state.cameras)) return;
    this.set(`cameras.${cam}`, true);
    this.set('security', { ...this.state.security, zones: { ...this.state.security.zones, [zone]: 'motion' } });
    setTimeout(() => {
      this.set(`cameras.${cam}`, false);
      this.set('security', { ...this.state.security, zones: { ...this.state.security.zones, [zone]: 'ok' } });
    }, 9000);
  }

  private randomEvent() {
    if (this.state.scene !== 'away') this.demoEvent(this.night ? 'motion' : 'doorbell');
    setTimeout(() => this.randomEvent(), 70000 + Math.random() * 40000);
  }

  private computePower() {
    let w = 180;
    for (const d of house.devices) {
      const s = this.state.devices[d.id];
      if (d.caps.includes('dimmer')) w += (s.level ?? 0) * 0.6;
      if (d.caps.includes('media') && s.on) w += 120;
      if (d.caps.includes('speaker') && s.playing) w += 15;
      if (d.caps.includes('vacuum') && s.status === 'cleaning') w += 30;
      if (d.caps.includes('floorHeat') && s.on) w += 400;
      if (d.caps.includes('fireplace') && s.on) w += 1800;
      if (d.caps.includes('fan') && s.on) w += 40;
      if (d.caps.includes('appliance') && s.on) w += d.kind === 'oven' ? 2100 : d.kind === 'washer' ? 500 : d.kind === 'av' ? 25 : 60;
      if (d.caps.includes('climate') && d.kind === 'ac' && s.mode !== 'off') w += 900;
    }
    return Math.round(w / 10) * 10;
  }

  // ——— time ———
  private fastTick() {
    const now = performance.now();
    for (const [key, f] of this.fades) {
      const [id, k] = key.split('|');
      const t = Math.min(1, (now - f.start) / f.dur);
      const v = Math.round(f.from + (f.to - f.from) * ease(t));
      this.dset(id, k as keyof DeviceState, v);
      if (t >= 1) {
        this.fades.delete(key);
        if (k === 'level') this.dset(id, 'on', f.to > 0);
        this.set('power', this.computePower());
      }
    }
    // пешеход: спальня → холл → кухня и обратно, цикл 40 с
    this.walkClock += 0.05;
    const cyc = this.walkClock % 40;
    const away = this.state.scene === 'away' || !house.walker;
    let walker: HomeState['walker'] = null;
    if (!away) {
      if (cyc < 11) walker = { room: '', t: cyc / 11 };
      else if (cyc < 22) walker = { room: 'kitchen', t: 1 };
      else if (cyc < 33) walker = { room: '', t: 1 - (cyc - 22) / 11 };
      else walker = { room: 'bedroom', t: 0 };
      walker.room = walker.t < 0.18 ? 'bedroom' : walker.t > 0.85 ? 'kitchen' : 'hall';
      walker.t = Math.round(walker.t * 1000) / 1000;
    }
    this.set('walker', walker);
  }

  private slowTick() {
    for (const d of house.devices) {
      const s = this.state.devices[d.id];
      // датчик присутствия и вентиляция по нему: на объекте это поведение в ядре
      const occ = (this.state.presence[d.room] ?? 0) > 0 || this.state.walker?.room === d.room;
      if (d.caps.includes('occupancy')) this.dset(d.id, 'motion', occ);
      if (d.caps.includes('fan')) this.dset(d.id, 'on', occ);
      if (d.caps.includes('climate') && s.mode !== 'off') {
        const diff = (s.target ?? 22) - (s.current ?? 22);
        if (Math.abs(diff) > 0.05) this.dset(d.id, 'current', Math.round(((s.current ?? 22) + Math.sign(diff) * 0.05) * 100) / 100);
      }
      if ((d.caps.includes('media') && s.on && s.playing) || (d.caps.includes('speaker') && s.playing))
        this.dset(d.id, 'progress', ((s.progress ?? 0) + 1 / 5400) % 1);
      if (d.caps.includes('vacuum')) {
        if (s.status === 'cleaning') {
          const cleaned = Math.round(((s.cleaned ?? 0) + 0.12) * 10) / 10;
          this.dset(d.id, 'cleaned', cleaned);
          this.dset(d.id, 'battery', Math.max(5, Math.round(((s.battery ?? 100) - 0.05) * 10) / 10));
          if (cleaned >= 42) { this.dset(d.id, 'status', 'returning'); this.event('Пылесос', 'уборка завершена, 42 м²'); }
        } else if (s.status === 'returning') {
          this.dset(d.id, 'status', 'docked'); this.dset(d.id, 'cleaned', 0);
        } else if ((s.battery ?? 100) < 100) this.dset(d.id, 'battery', Math.min(100, Math.round(((s.battery ?? 0) + 0.2) * 10) / 10));
      }
    }
    this.set('power', this.computePower());
  }
}
