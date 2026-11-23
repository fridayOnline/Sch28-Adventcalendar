import { describe, expect, it } from 'vitest';
import { customKey, isCustomKey, isSingleEmoji } from '@/lib/emoji';

describe('isSingleEmoji', () => {
  it('ふつうの絵文字・肌の色・ZWJ・国旗・キーキャップを1文字として通す', () => {
    for (const e of ['👍', '❤️', '👍🏽', '👨‍👩‍👧', '🇯🇵', '1️⃣', '🍣']) {
      expect(isSingleEmoji(e)).toBe(true);
    }
  });

  it('文字・数字・2文字以上・空文字を弾く', () => {
    for (const e of ['a', '1', 'あ', '👍👍', '', ' ', 'c:abc']) {
      expect(isSingleEmoji(e)).toBe(false);
    }
  });
});

describe('カスタム絵文字のキー', () => {
  it('"c:<id>" の形', () => {
    expect(customKey('abc')).toBe('c:abc');
    expect(isCustomKey('c:abc')).toBe(true);
    expect(isCustomKey('👍')).toBe(false);
  });
});
