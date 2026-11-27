import { describe, expect, it } from 'vitest';
import { CALENDARS, dayHref, editHref, entryHref, homeHref, parseCalParam, withCal } from '@/lib/calendars';

describe('parseCalParam', () => {
  it('無ければ1枚目', () => {
    expect(parseCalParam(undefined)).toBe(1);
    expect(parseCalParam(null)).toBe(1);
    expect(parseCalParam('')).toBe(1);
  });
  it('範囲内の数字はそのまま', () => {
    for (const c of CALENDARS) expect(parseCalParam(String(c))).toBe(c);
    expect(parseCalParam(['2', '1'])).toBe(2);
  });
  it('範囲外・数字でないものは null', () => {
    expect(parseCalParam('0')).toBeNull();
    expect(parseCalParam(String(CALENDARS.length + 1))).toBeNull();
    expect(parseCalParam('1.5')).toBeNull();
    expect(parseCalParam('abc')).toBeNull();
  });
});

describe('URL に cal を付ける', () => {
  it('1枚目は今までどおりの URL', () => {
    expect(homeHref(1)).toBe('/');
    expect(dayHref(1, 5)).toBe('/day/5');
    expect(entryHref(1, 5)).toBe('/entry?day=5');
    expect(editHref(1, 5)).toBe('/edit?day=5');
    expect(withCal('/api/slots/5', 1)).toBe('/api/slots/5');
  });
  it('2枚目は ?cal=2 / &cal=2', () => {
    expect(homeHref(2)).toBe('/?cal=2');
    expect(dayHref(2, 5)).toBe('/day/5?cal=2');
    expect(entryHref(2)).toBe('/entry?cal=2');
    expect(entryHref(2, 5)).toBe('/entry?day=5&cal=2');
    expect(withCal('/api/days/5?clientId=x', 2)).toBe('/api/days/5?clientId=x&cal=2');
  });
});
