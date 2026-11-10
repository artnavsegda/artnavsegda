/**
 * Основной контракт приложения — Code Verification API (swagger.json).
 * Заявка на проверку: POST /check-code {code_number, month, last_code} -> {order_id};
 * результат приходит не сразу, поэтому опрашиваем GET /check-status/{order_id}.
 *
 * Формат номера на странице — 4 блока: number | month | code | tail (см. lib/parser.ts).
 * В теле /check-code по свагеру только 3 поля, поэтому третий и четвёртый блок
 * склеиваются в last_code (code+tail). Если на бэкенде это должно быть отдельным
 * полем — поменять тут, в одном месте.
 */
import { http } from './http';

export type CheckState = 'error' | 'valid' | 'fail' | null;

export interface CheckStatus {
  /** В спеке `null` встречается и как значение, и как строка "null" — учитываем оба варианта. */
  state: CheckState | 'null';
  code_error?: string;
  zip_is_correct?: boolean | null;
}

export function isPendingStatus(s: CheckStatus): boolean {
  return s.state === null || s.state === 'null';
}

export interface WalletModel {
  name?: string;
  network: string;
  currency: string;
  address: string;
}

export interface AccountInfo {
  balance: number;
  price: number;
  wallets: WalletModel[];
}

export const orderApi = {
  checkCode: (code_number: string, month: string, code: string, tail: string) =>
    http.post<{ order_id: string }>('order', '/check-code', { code_number, month, last_code: `${code}${tail}` }),

  checkStatus: (orderId: string) => http.get<CheckStatus>('order', `/check-status/${encodeURIComponent(orderId)}`),

  /** `pending` — сколько заявок этого аккаунта сейчас в обработке на сервере. */
  getLimit: () => http.get<{ pending: number }>('order', '/get-limit'),

  accountInfo: () => http.get<AccountInfo>('order', '/account-info')
};
