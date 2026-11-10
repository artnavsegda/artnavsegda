import type { Parsed } from './parser';
import { authApi, isPending, type Me } from './api/auth';
import { orderApi, isPendingStatus, type WalletModel } from './api/order';
import { ApiError, getApiKey, setApiKey } from './api/http';
import { POLL_INTERVAL_MS } from './config';

export type Result = { ok: true } | { ok: false; error: string };

export interface QueueItem {
  id: string;
  number: string;
  mm: string;
  code: string;
  tail: string;
  orderId: string;
  createdAt: number;
}

export type HistoryResult = 'success' | 'fail' | 'error';

export interface HistoryItem {
  id: string;
  value: string;
  result: HistoryResult;
  detail?: string;
  checkedAt: number;
}

const HISTORY_KEY = 'sombrero:history:v1';

function loadHistory(): HistoryItem[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function errorMessage(e: unknown, fallback: string): string {
  return e instanceof ApiError ? e.message || fallback : fallback;
}

/**
 * Состояние приложения на реальном API:
 *  - авторизация и сессия — auth-контракт (см. lib/api/auth.ts);
 *  - баланс, кошельки, заявки на проверку — order-контракт (см. lib/api/order.ts).
 *
 * В присланных контрактах нет точки со списком пополнений/трат и нет точки
 * «выпустить кошельки» — баланс и кошельки целиком берутся из /account-info.
 * История проверок на сервере тоже не хранится (только /check-status по id),
 * поэтому локально копим то, что опросили сами, в localStorage — это кэш для
 * удобства, а не состояние с сервера.
 */
class Store {
  user = $state<Me | null>(null);
  booting = $state(true);

  balance = $state(0);
  price = $state(0);
  wallets = $state<WalletModel[]>([]);
  pending = $state(0);

  queue = $state<QueueItem[]>([]);
  history = $state<HistoryItem[]>(loadHistory());

  get stats() {
    return {
      checked: this.history.length,
      queued: this.pending,
      affordable: this.price > 0 ? Math.floor(this.balance / this.price + 1e-9) : 0
    };
  }

  private persistHistory() {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify($state.snapshot(this.history)));
    } catch {
      /* ignore */
    }
  }

  /** Проверить сессию при загрузке приложения. */
  async boot() {
    this.booting = true;
    try {
      const { user } = await authApi.session();
      this.user = user;
      await this.afterAuth();
    } catch {
      this.user = null;
    } finally {
      this.booting = false;
    }
  }

  /** После входа/регистрации: получить API-ключ для order-API и подтянуть баланс/лимит. */
  private async afterAuth() {
    if (!getApiKey()) {
      try {
        const { secret } = await authApi.createApiKey();
        setApiKey(secret);
      } catch {
        /* продолжаем без ключа — запросы к order-API вернут понятную 401 */
      }
    }
    await Promise.all([this.loadAccount(), this.refreshLimit()]);
  }

  async loadAccount(): Promise<Result> {
    try {
      const info = await orderApi.accountInfo();
      this.balance = info.balance;
      this.price = info.price;
      this.wallets = info.wallets ?? [];
      return { ok: true };
    } catch (e) {
      return { ok: false, error: errorMessage(e, 'Не удалось получить данные аккаунта') };
    }
  }

  async refreshLimit() {
    try {
      this.pending = (await orderApi.getLimit()).pending;
    } catch {
      /* фоновое обновление — молча пропускаем */
    }
  }

  // ───── авторизация ─────

  async register(login: string, password: string, repeat: string): Promise<Result> {
    if (password !== repeat) return { ok: false, error: 'Пароли не совпадают' };
    try {
      this.user = await authApi.register(login, password);
      await this.afterAuth();
      return { ok: true };
    } catch (e) {
      return { ok: false, error: errorMessage(e, 'Не удалось зарегистрироваться') };
    }
  }

  async login(login: string, password: string): Promise<Result> {
    try {
      this.user = await authApi.login(login, password);
      await this.afterAuth();
      return { ok: true };
    } catch (e) {
      return { ok: false, error: errorMessage(e, 'Неверный логин или пароль') };
    }
  }

  async logout() {
    try {
      await authApi.logout();
    } catch {
      /* сессия уже недействительна — всё равно выходим локально */
    }
    this.user = null;
    setApiKey(null);
    this.queue = [];
  }

  startTelegramLogin() {
    return authApi.startTelegramLogin();
  }

  startTelegramLink() {
    return authApi.startTelegramLink();
  }

  /** true — подтверждено (сессия и профиль обновлены), false — пока ждём. */
  async pollTelegram(code: string): Promise<boolean> {
    const res = await authApi.checkTelegram(code);
    if (isPending(res)) return false;
    this.user = res;
    await this.afterAuth();
    return true;
  }

  async unlinkTelegram(): Promise<Result> {
    try {
      this.user = await authApi.unlinkTelegram();
      return { ok: true };
    } catch (e) {
      return { ok: false, error: errorMessage(e, 'Не удалось отвязать Telegram') };
    }
  }

  /** Для аккаунтов из Telegram без логина — создаёт логин и пароль. */
  async setCredentials(login: string, password: string): Promise<Result> {
    try {
      this.user = await authApi.setCredentials({ login, new_password: password });
      return { ok: true };
    } catch (e) {
      return { ok: false, error: errorMessage(e, 'Не удалось сохранить') };
    }
  }

  // ───── заявки на проверку ─────

  async enqueue(items: Parsed[]): Promise<Result> {
    if (!items.length) return { ok: false, error: 'Нечего добавлять' };
    const cost = items.length * this.price;
    if (this.balance < cost) return { ok: false, error: 'Недостаточно средств на балансе' };

    const failures: string[] = [];
    for (const it of items) {
      try {
        const { order_id } = await orderApi.checkCode(it.number, it.mm, it.code, it.tail);
        this.queue.push({
          id: crypto.randomUUID(),
          number: it.number,
          mm: it.mm,
          code: it.code,
          tail: it.tail,
          orderId: order_id,
          createdAt: Date.now()
        });
      } catch (e) {
        failures.push(`${it.value}: ${errorMessage(e, 'ошибка отправки')}`);
      }
    }

    await Promise.all([this.loadAccount(), this.refreshLimit()]);

    if (failures.length) {
      return { ok: false, error: `Отправлено не всё (${items.length - failures.length} из ${items.length}): ${failures[0]}` };
    }
    return { ok: true };
  }

  /** Опрашивает /check-status по каждой заявке из очереди. */
  async poll() {
    if (!this.queue.length) return;
    const still: QueueItem[] = [];

    for (const item of this.queue) {
      try {
        const status = await orderApi.checkStatus(item.orderId);
        if (isPendingStatus(status)) {
          still.push(item);
          continue;
        }
        const result: HistoryResult = status.state === 'valid' ? 'success' : status.state === 'fail' ? 'fail' : 'error';
        this.history.unshift({
          id: item.id,
          value: `${item.number}|${item.mm}|${item.code}|${item.tail}`,
          result,
          detail: status.code_error,
          checkedAt: Date.now()
        });
      } catch {
        still.push(item); // временная ошибка сети — попробуем на следующем тике
      }
    }

    this.queue = still;
    this.persistHistory();
    await this.refreshLimit();
  }
}

export const store = new Store();

export function startWorker() {
  store.boot();
  setInterval(() => {
    if (store.user) store.poll();
  }, POLL_INTERVAL_MS);
}
