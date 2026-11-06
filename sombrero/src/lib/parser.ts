export interface Parsed {
  number: string;
  mm: string;
  /** Второй двухцифровой блок (без проверки на месяц) */
  code: string;
  tail: string;
  /** Нормализованный вид: number|mm|code|tail */
  value: string;
}

export interface Bad {
  raw: string;
  reason: string;
}

export interface ParseResult {
  ok: Parsed[];
  bad: Bad[];
}

export interface SepOption {
  id: string;
  label: string;
}

export const FIELD_SEPARATORS: SepOption[] = [
  { id: '|', label: 'Вертикальная черта  |' },
  { id: '-', label: 'Дефис  -' },
  { id: ';', label: 'Точка с запятой  ;' },
  { id: ',', label: 'Запятая  ,' },
  { id: ':', label: 'Двоеточие  :' },
  { id: '/', label: 'Слэш  /' },
  { id: 'space', label: 'Пробел' },
  { id: 'tab', label: 'Табуляция' },
  { id: 'custom', label: 'Свой вариант…' }
];

export const RECORD_SEPARATORS: SepOption[] = [
  { id: 'newline', label: 'Новая строка' },
  { id: ';', label: 'Точка с запятой  ;' },
  { id: ',', label: 'Запятая  ,' },
  { id: '|', label: 'Вертикальная черта  |' },
  { id: 'space', label: 'Пробел' },
  { id: 'custom', label: 'Свой вариант…' }
];

type Splitter = string | RegExp;

export function makeSplitter(id: string, custom: string, kind: 'field' | 'record'): Splitter | null {
  switch (id) {
    case 'custom':
      return custom ? custom : null;
    case 'space':
      return kind === 'record' ? /\s+/ : /[ \t]+/;
    case 'tab':
      return '\t';
    case 'newline':
      return /\r?\n/;
    default:
      return id;
  }
}

function canonical(id: string, custom: string): string {
  if (id === 'custom') return custom;
  if (id === 'newline') return '\n';
  if (id === 'tab') return '\t';
  return id; // 'space' и одиночные символы
}

/** Возвращает текст ошибки, если разделитель полей совпадает с разделителем записей. */
export function separatorConflict(
  fieldId: string,
  fieldCustom: string,
  recordId: string,
  recordCustom: string
): string | null {
  const f = canonical(fieldId, fieldCustom);
  const r = canonical(recordId, recordCustom);
  if (f && r && f === r) {
    return 'Разделитель полей и разделитель записей не могут совпадать.';
  }
  return null;
}

const RE_NUMBER = /^\d{11,13}$/;
const RE_TWO = /^\d{2}$/;
const RE_TAIL = /^\d{3}$/;

function validate(parts: string[]): string | null {
  if (parts.length !== 4) return `Ожидалось 4 поля, найдено ${parts.length}`;
  const [number, mm, code, tail] = parts;
  if (!/^\d+$/.test(number)) return 'Первый блок содержит нецифровые символы';
  if (!RE_NUMBER.test(number)) return 'Первый блок должен содержать 11–13 цифр';
  if (!RE_TWO.test(mm)) return 'Второй блок (месяц): ровно 2 цифры';
  const m = Number(mm);
  if (m < 1 || m > 12) return 'Месяц должен быть от 01 до 12';
  if (!RE_TWO.test(code)) return 'Третий блок: ровно 2 цифры';
  if (!RE_TAIL.test(tail)) return 'Последний блок: ровно 3 цифры';
  return null;
}

export function parseNumbers(text: string, field: Splitter, record: Splitter): ParseResult {
  const records = text
    .split(record)
    .map((s) => s.trim())
    .filter(Boolean);

  const ok: Parsed[] = [];
  const bad: Bad[] = [];
  const seen = new Set<string>();

  for (const raw of records) {
    const parts = raw.split(field).map((s) => s.trim());
    const reason = validate(parts);
    if (reason) {
      bad.push({ raw, reason });
      continue;
    }
    const [number, mm, code, tail] = parts;
    const value = `${number}|${mm}|${code}|${tail}`;
    if (seen.has(value)) {
      bad.push({ raw, reason: 'Дубликат в этом списке' });
      continue;
    }
    seen.add(value);
    ok.push({ number, mm, code, tail, value });
  }

  return { ok, bad };
}
