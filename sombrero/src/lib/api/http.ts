/**
 * Тонкий клиент для двух контрактов:
 *  - "auth"  — VPS Panel REST API (openapi.json), сессия по cookie `vps_token`
 *  - "order" — Code Verification API (swagger.json), ключ в заголовке Authorization
 *
 * Базовые пути можно переопределить переменными окружения Vite
 * (VITE_AUTH_API_BASE / VITE_ORDER_API_BASE), не трогая код.
 */

export type ApiBase = 'auth' | 'order';

const BASES: Record<ApiBase, string> = {
  auth: import.meta.env.VITE_AUTH_API_BASE ?? '/api/v1',
  order: import.meta.env.VITE_ORDER_API_BASE ?? '/api'
};

export interface ApiErrorBody {
  error?: { code?: string; message?: string; field?: string };
  message?: string; // старый формат (swagger "Code Verification API")
}

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly field?: string;

  constructor(status: number, body: ApiErrorBody | null) {
    const message = body?.error?.message ?? body?.message ?? `Ошибка сервера (HTTP ${status})`;
    super(message);
    this.status = status;
    this.code = body?.error?.code ?? 'unknown_error';
    this.field = body?.error?.field;
  }
}

const API_KEY_STORAGE = 'sombrero:api_key';
let apiKey: string | null = null;
try {
  apiKey = localStorage.getItem(API_KEY_STORAGE);
} catch {
  /* localStorage недоступен (приватный режим и т.п.) */
}

/** Ключ, который order-API (Code Verification) принимает в заголовке Authorization. */
export function setApiKey(key: string | null) {
  apiKey = key;
  try {
    if (key) localStorage.setItem(API_KEY_STORAGE, key);
    else localStorage.removeItem(API_KEY_STORAGE);
  } catch {
    /* ignore */
  }
}

export function getApiKey(): string | null {
  return apiKey;
}

async function request<T>(base: ApiBase, path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');

  if (base === 'order') {
    if (!apiKey) {
      throw new ApiError(401, { error: { code: 'no_api_key', message: 'Нет API-ключа — сначала войдите в аккаунт.' } });
    }
    headers.set('Authorization', `Bearer ${apiKey}`);
  }

  const res = await fetch(BASES[base] + path, {
    ...init,
    headers,
    // сессия auth-API живёт в HttpOnly cookie — нужны credentials; order-API аутентифицируется ключом
    credentials: base === 'auth' ? 'include' : 'same-origin'
  });

  const text = await res.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }
  }

  if (!res.ok) throw new ApiError(res.status, data as ApiErrorBody);
  return data as T;
}

export const http = {
  get: <T>(base: ApiBase, path: string) => request<T>(base, path, { method: 'GET' }),
  post: <T>(base: ApiBase, path: string, body?: unknown) =>
    request<T>(base, path, { method: 'POST', body: body !== undefined ? JSON.stringify(body) : undefined }),
  put: <T>(base: ApiBase, path: string, body?: unknown) =>
    request<T>(base, path, { method: 'PUT', body: JSON.stringify(body) }),
  patch: <T>(base: ApiBase, path: string, body?: unknown) =>
    request<T>(base, path, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: <T>(base: ApiBase, path: string) => request<T>(base, path, { method: 'DELETE' })
};
