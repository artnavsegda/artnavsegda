export interface User {
  id: string;
  login: string;
  passHash: string;
  secret: string;
  telegram: string | null;
  createdAt: number;
  balance: number;
}

export interface Wallet {
  id: string;
  userId: string;
  currency: string;
  network: string;
  address: string;
}

export type TxType = 'in' | 'out';

export interface Tx {
  id: string;
  userId: string;
  type: TxType;
  amount: number;
  note: string;
  createdAt: number;
}

export interface QueueItem {
  id: string;
  userId: string;
  number: string;
  mm: string;
  tail: string;
  createdAt: number;
}

export type CheckResult = 'success' | 'fail';

export interface HistoryItem {
  id: string;
  userId: string;
  value: string;
  result: CheckResult;
  checkedAt: number;
}

export type Result = { ok: true } | { ok: false; error: string };
