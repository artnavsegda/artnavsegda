import type { HistoryItem, QueueItem, Result, Tx, User, Wallet } from './types';
import { CHECK_INTERVAL_MS, PRICE_PER_NUMBER } from './config';
import type { Parsed } from './parser';

/**
 * Локальная «база» на localStorage — заглушка до появления бэкенда.
 * Все публичные методы store вернут/примут то же, что понадобится API,
 * так что заменить реализацию на fetch-запросы можно не трогая страницы.
 */

interface DB {
  users: User[];
  session: string | null;
  wallets: Wallet[];
  tx: Tx[];
  queue: QueueItem[];
  history: HistoryItem[];
}

const KEY = 'sombrero:db:v1';
const uid = () => crypto.randomUUID();
const round2 = (n: number) => Math.round(n * 100) / 100;

function emptyDB(): DB {
  return { users: [], session: null, wallets: [], tx: [], queue: [], history: [] };
}

function load(): DB {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...emptyDB(), ...JSON.parse(raw) };
  } catch {
    /* повреждённые данные — начинаем с чистого листа */
  }
  return emptyDB();
}

async function sha256(s: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function randHex(len: number) {
  const a = new Uint8Array(len / 2);
  crypto.getRandomValues(a);
  return [...a].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function randBase58(len: number) {
  const alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  const a = new Uint8Array(len);
  crypto.getRandomValues(a);
  return [...a].map((b) => alphabet[b % alphabet.length]).join('');
}

const normTg = (s: string) => s.trim().replace(/^@/, '').toLowerCase();

class Store {
  db = $state<DB>(load());

  get user(): User | null {
    return this.db.users.find((u) => u.id === this.db.session) ?? null;
  }

  get wallets(): Wallet[] {
    const u = this.user;
    return u ? this.db.wallets.filter((w) => w.userId === u.id) : [];
  }

  get transactions(): Tx[] {
    const u = this.user;
    return u ? this.db.tx.filter((t) => t.userId === u.id).sort((a, b) => b.createdAt - a.createdAt) : [];
  }

  get queue(): QueueItem[] {
    const u = this.user;
    return u ? this.db.queue.filter((q) => q.userId === u.id) : [];
  }

  get history(): HistoryItem[] {
    const u = this.user;
    return u ? this.db.history.filter((h) => h.userId === u.id) : [];
  }

  /** checked — проверено; queued — в очереди; affordable — сколько ещё номеров можно поставить на текущий баланс */
  get stats() {
    const balance = this.user?.balance ?? 0;
    return {
      checked: this.history.length,
      queued: this.queue.length,
      affordable: Math.floor(round2(balance / PRICE_PER_NUMBER + 1e-9))
    };
  }

  private save() {
    try {
      localStorage.setItem(KEY, JSON.stringify($state.snapshot(this.db)));
    } catch {
      /* хранилище недоступно */
    }
  }

  private createUser(login: string, passHash: string, secret: string, telegram: string | null): User {
    const user: User = {
      id: uid(),
      login,
      passHash,
      secret,
      telegram,
      createdAt: Date.now(),
      balance: 0
    };
    this.db.users.push(user);
    this.db.session = user.id;
    this.save();
    return user;
  }

  // ───── авторизация ─────

  async register(login: string, password: string, repeat: string, secret: string): Promise<Result> {
    login = login.trim();
    if (!/^[a-zA-Z0-9_]{3,24}$/.test(login)) {
      return { ok: false, error: 'Логин: 3–24 символа, латиница, цифры и _' };
    }
    if (password.length < 8) return { ok: false, error: 'Пароль должен быть не короче 8 символов' };
    if (password !== repeat) return { ok: false, error: 'Пароли не совпадают' };
    if (this.db.users.some((u) => u.login.toLowerCase() === login.toLowerCase())) {
      return { ok: false, error: 'Этот логин уже занят' };
    }
    this.createUser(login, await sha256(password), secret.trim(), null);
    return { ok: true };
  }

  async login(login: string, password: string): Promise<Result> {
    const user = this.db.users.find((u) => u.login.toLowerCase() === login.trim().toLowerCase());
    if (!user || user.passHash !== (await sha256(password))) {
      return { ok: false, error: 'Неверный логин или пароль' };
    }
    this.db.session = user.id;
    this.save();
    return { ok: true };
  }

  async loginWithTelegram(username: string): Promise<Result> {
    const tg = normTg(username);
    if (!/^[a-z0-9_]{5,32}$/.test(tg)) return { ok: false, error: 'Введите корректный Telegram-username' };
    const existing = this.db.users.find((u) => u.telegram === tg);
    if (existing) {
      this.db.session = existing.id;
      this.save();
      return { ok: true };
    }
    let login = `tg_${tg}`;
    while (this.db.users.some((u) => u.login.toLowerCase() === login.toLowerCase())) {
      login = `tg_${tg}_${randHex(4)}`;
    }
    this.createUser(login, await sha256(randHex(32)), '', tg);
    return { ok: true };
  }

  logout() {
    this.db.session = null;
    this.save();
  }

  linkTelegram(username: string): Result {
    const u = this.user;
    if (!u) return { ok: false, error: 'Нужно войти в аккаунт' };
    const tg = normTg(username);
    if (!/^[a-z0-9_]{5,32}$/.test(tg)) return { ok: false, error: 'Введите корректный Telegram-username' };
    if (this.db.users.some((x) => x.telegram === tg && x.id !== u.id)) {
      return { ok: false, error: 'Этот Telegram уже привязан к другому аккаунту' };
    }
    u.telegram = tg;
    this.save();
    return { ok: true };
  }

  unlinkTelegram() {
    const u = this.user;
    if (u) {
      u.telegram = null;
      this.save();
    }
  }

  // ───── биллинг ─────

  claimWallets(): Result {
    const u = this.user;
    if (!u) return { ok: false, error: 'Нужно войти в аккаунт' };
    if (this.wallets.length) return { ok: true };
    this.db.wallets.push(
      { id: uid(), userId: u.id, currency: 'USDT', network: 'TRC-20', address: 'T' + randBase58(33) },
      { id: uid(), userId: u.id, currency: 'BTC', network: 'Bitcoin', address: 'bc1q' + randHex(34) },
      { id: uid(), userId: u.id, currency: 'ETH', network: 'ERC-20', address: '0x' + randHex(40) }
    );
    this.save();
    return { ok: true };
  }

  /** Тестовое пополнение — убрать, когда появится реальный приём платежей. */
  demoTopUp(amount: number) {
    const u = this.user;
    if (!u) return;
    u.balance = round2(u.balance + amount);
    this.db.tx.push({ id: uid(), userId: u.id, type: 'in', amount, note: 'Пополнение баланса', createdAt: Date.now() });
    this.save();
  }

  // ───── очередь ─────

  enqueue(items: Parsed[]): Result {
    const u = this.user;
    if (!u) return { ok: false, error: 'Нужно войти в аккаунт' };
    if (!items.length) return { ok: false, error: 'Нечего добавлять' };
    const cost = round2(items.length * PRICE_PER_NUMBER);
    if (u.balance < cost) return { ok: false, error: 'Недостаточно средств на балансе' };

    u.balance = round2(u.balance - cost);
    const now = Date.now();
    for (const it of items) {
      this.db.queue.push({ id: uid(), userId: u.id, number: it.number, mm: it.mm, code: it.code, tail: it.tail, createdAt: now });
    }
    this.db.tx.push({
      id: uid(),
      userId: u.id,
      type: 'out',
      amount: cost,
      note: `Проверка номеров: ${items.length} шт.`,
      createdAt: now
    });
    this.save();
    return { ok: true };
  }

  /** Имитация воркера: обрабатывает по одному номеру из очереди. Заменить на опрос API. */
  tick() {
    const u = this.user;
    if (!u) return;
    const idx = this.db.queue.findIndex((q) => q.userId === u.id);
    if (idx < 0) return;
    const [item] = this.db.queue.splice(idx, 1);
    this.db.history.unshift({
      id: uid(),
      userId: item.userId,
      value: [item.number, item.mm, item.code, item.tail].filter(Boolean).join('|'),
      result: Math.random() < 0.7 ? 'success' : 'fail',
      checkedAt: Date.now()
    });
    this.save();
  }
}

export const store = new Store();

export function startWorker() {
  setInterval(() => store.tick(), CHECK_INTERVAL_MS);
}
