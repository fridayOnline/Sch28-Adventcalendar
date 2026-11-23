const YEAR = Number(process.env.EVENT_YEAR ?? 2026);

export const eventYear = () => YEAR;

export const publishAt = (day: number) =>
  new Date(`${YEAR}-12-${String(day).padStart(2, '0')}T00:00:00+09:00`);

/**
 * 「今」。開発時だけ環境変数 DEV_NOW（例: 2026-12-12T09:00:00+09:00）で固定できる。
 * 本番（NODE_ENV=production）では常に実際の時刻。
 */
export const currentTime = () => {
  const fake = process.env.NODE_ENV !== 'production' ? process.env.DEV_NOW : undefined;
  if (fake) {
    const d = new Date(fake);
    if (!Number.isNaN(d.getTime())) return d;
  }
  return new Date();
};

export const isPublished = (day: number, now = currentTime()) =>
  now.getTime() >= publishAt(day).getTime();

/** JSTで EVENT_YEAR年12月1〜25日ならその日、それ以外は null */
export const todayDay = (now = currentTime()) => {
  const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000); // UTCのフィールドでJSTを読む
  const ok =
    jst.getUTCFullYear() === YEAR && jst.getUTCMonth() === 11 && jst.getUTCDate() <= 25;
  return ok ? jst.getUTCDate() : null;
};

/** 12/1 の曜日（0=日）。グリッド先頭の空マス数になる。
 *  UTCのフィールドで「JSTの暦日」を読むので、実行環境のTZに影響されない */
export const leadingPadCount = () => new Date(Date.UTC(YEAR, 11, 1)).getUTCDay();

const WEEKDAYS_JA = ['日', '月', '火', '水', '木', '金', '土'];

export const weekdayJa = (day: number) =>
  WEEKDAYS_JA[(leadingPadCount() + day - 1) % 7];

const WEEKDAYS_EN = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

export const weekdayEn = (day: number) =>
  WEEKDAYS_EN[(leadingPadCount() + day - 1) % 7];
