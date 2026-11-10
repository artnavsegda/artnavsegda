/**
 * Авторизация — из прошлого проекта (VPS Panel REST API, openapi.json),
 * потому что в контракте Code Verification API (swagger.json) точек
 * регистрации/входа нет: там только обработка уже оформленных заказов
 * с готовым API-ключом в заголовке Authorization.
 *
 * Эндпоинты: POST /auth/register, POST /auth/session (+GET/DELETE),
 * POST /auth/telegram(+/check), POST|DELETE /me/telegram, PUT /me/credentials,
 * POST /tokens (используется здесь, чтобы получить ключ для order-API).
 */
import { http } from './http';

export interface Me {
  id: number;
  login: string | null; // null — аккаунт создан через Telegram, логин ещё не задан
  balance: string;
  language: 'ru' | 'en';
  created_at: string;
  servers_count: number;
  telegram: { id?: number; username: string | null } | null;
  personal_discount?: number;
}

export interface TelegramRequest {
  url: string;
  code: string;
  expires_at: string;
}

export interface TelegramPending {
  status: 'pending';
}

export function isPending(x: unknown): x is TelegramPending {
  return !!x && typeof x === 'object' && (x as TelegramPending).status === 'pending';
}

export const authApi = {
  register: (login: string, password: string, language: 'ru' | 'en' = 'ru') =>
    http.post<Me>('auth', '/auth/register', { login, password, accept_terms: true, language }),

  login: (login: string, password: string, remember = true) =>
    http.post<Me>('auth', '/auth/session', { login, password, remember }),

  session: () => http.get<{ kind: string; expires_at: string | null; user: Me }>('auth', '/auth/session'),

  logout: () => http.delete<void>('auth', '/auth/session'),

  /** Вход через Telegram-бота: вернёт ссылку и код для опроса. */
  startTelegramLogin: () => http.post<TelegramRequest>('auth', '/auth/telegram'),

  /** Опрос каждые 2–3 с до expires_at: 200 — подтверждено, 202 — ждём. */
  checkTelegram: (code: string) => http.post<Me | TelegramPending>('auth', '/auth/telegram/check', { code }),

  /** Привязка Telegram к уже авторизованному аккаунту — тот же опрос checkTelegram. */
  startTelegramLink: () => http.post<TelegramRequest>('auth', '/me/telegram'),

  unlinkTelegram: () => http.delete<Me>('auth', '/me/telegram'),

  /** Создать логин (для аккаунта из Telegram) или сменить пароль. */
  setCredentials: (payload: { login?: string; current_password?: string; new_password: string }) =>
    http.put<Me>('auth', '/me/credentials', payload),

  /** Ключ для Authorization заголовка Code Verification API; secret показывается один раз. */
  createApiKey: (name = 'Sombrero web') => http.post<{ token: { id: number }; secret: string }>('auth', '/tokens', { name })
};
