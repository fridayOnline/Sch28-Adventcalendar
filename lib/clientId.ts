const KEY = 'advent:clientId';

let memoryId: string | null = null;

const uuid = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  // 保険：randomUUID が無い環境
  return '00000000-0000-4000-8000-' + Date.now().toString(16).padStart(12, '0').slice(-12);
};

/** localStorage が使えない環境ではそのページの間だけ有効なIDを使う */
export function getClientId(): string {
  try {
    const saved = localStorage.getItem(KEY);
    if (saved) return saved;
    const made = uuid();
    localStorage.setItem(KEY, made);
    return made;
  } catch {
    if (!memoryId) memoryId = uuid();
    return memoryId;
  }
}

export const NAME_KEY = 'advent:name';

export function getSavedName(): string {
  try {
    return localStorage.getItem(NAME_KEY) ?? '';
  } catch {
    return '';
  }
}

export function saveName(name: string): void {
  try {
    localStorage.setItem(NAME_KEY, name);
  } catch {
    /* 使えないなら覚えない */
  }
}
