import { describe, expect, it } from 'vitest';
import { isPublished, leadingPadCount, todayDay, weekdayJa } from '@/lib/publish';

describe('isPublished', () => {
  it('JST 12/1 6:00 の直前は false、ちょうどで true', () => {
    expect(isPublished(1, new Date('2026-11-30T20:59:59Z'))).toBe(false);
    expect(isPublished(1, new Date('2026-11-30T21:00:00Z'))).toBe(true);
  });

  it('当日の0時〜6時はまだ開かない', () => {
    expect(isPublished(1, new Date('2026-11-30T15:00:00Z'))).toBe(false); // JST 12/1 0:00
    expect(isPublished(1, new Date('2026-11-30T20:00:00Z'))).toBe(false); // JST 12/1 5:00
  });

  it('25日も同じように切り替わる', () => {
    expect(isPublished(25, new Date('2026-12-24T20:59:59Z'))).toBe(false);
    expect(isPublished(25, new Date('2026-12-24T21:00:00Z'))).toBe(true);
  });
});

describe('todayDay', () => {
  it('JST 12/25 23:59 は 25', () => {
    expect(todayDay(new Date('2026-12-25T14:59:00Z'))).toBe(25);
  });

  it('JST 12/26 0:00 は null', () => {
    expect(todayDay(new Date('2026-12-25T15:00:00Z'))).toBe(null);
  });

  it('開催前は null', () => {
    expect(todayDay(new Date('2026-11-30T14:00:00Z'))).toBe(null);
  });

  it('JST 12/8 の午前中は 8', () => {
    expect(todayDay(new Date('2026-12-08T01:00:00Z'))).toBe(8);
  });
});

describe('グリッドの先頭', () => {
  it('2026/12/1 は火曜なので空マスは2つ', () => {
    expect(leadingPadCount()).toBe(2);
  });

  it('曜日が日付と対応する', () => {
    expect(weekdayJa(1)).toBe('火');
    expect(weekdayJa(6)).toBe('日');
    expect(weekdayJa(25)).toBe('金');
  });
});
