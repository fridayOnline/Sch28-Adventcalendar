/**
 * カレンダーの枚数と、URL に付ける ?cal= の扱い（サーバーとブラウザの両方で使う）。
 * 1枚目は今までどおり ?cal= なしの URL。2枚目以降だけ ?cal=N を付ける。
 * 枚数を増やすときは CALENDAR_COUNT を変えるだけでよい（DB は 1〜9 まで受け付ける）。
 */
export const CALENDAR_COUNT = 2;

/** [1, 2, …] */
export const CALENDARS: readonly number[] = Array.from({ length: CALENDAR_COUNT }, (_, i) => i + 1);

export const calendarLabel = (cal: number) => `カレンダー${cal}`;

/** 「カレンダー2・」のような前置き（カレンダーが1枚だけなら空） */
export const calendarPrefix = (cal: number) => (CALENDAR_COUNT > 1 ? `${calendarLabel(cal)}・` : '');

export const isCalendar = (n: number) => Number.isInteger(n) && n >= 1 && n <= CALENDAR_COUNT;

/**
 * ?cal= の値を読む。無ければ 1。範囲外・数字でないものは null（呼び出し側で 404 にする）。
 */
export function parseCalParam(value: string | string[] | null | undefined): number | null {
  const v = Array.isArray(value) ? value[0] : value;
  if (v === undefined || v === null || v === '') return 1;
  const n = Number(v);
  return isCalendar(n) ? n : null;
}

/** URL に cal を付ける（1枚目なら何も付けない）。既に ? がある URL にも使える */
export function withCal(url: string, cal: number): string {
  if (cal === 1) return url;
  return `${url}${url.includes('?') ? '&' : '?'}cal=${cal}`;
}

export const homeHref = (cal: number) => withCal('/', cal);
export const dayHref = (cal: number, day: number) => withCal(`/day/${day}`, cal);
export const entryHref = (cal: number, day?: number) => withCal(day ? `/entry?day=${day}` : '/entry', cal);
export const editHref = (cal: number, day: number) => withCal(`/edit?day=${day}`, cal);
