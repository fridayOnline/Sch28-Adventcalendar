import { describe, expect, it } from 'vitest';
import {
  adminSlotPatchSchema,
  commentSchema,
  daySchema,
  emojiNameSchema,
  reactionSchema,
  reserveSchema,
  updateSlotSchema,
} from '@/lib/validation';

const UUID = '11111111-2222-4333-8444-555555555555';

describe('updateSlotSchema', () => {
  it('https のURLを通す', () => {
    const r = updateSlotSchema.safeParse({
      editPassword: 'pass',
      title: '冬キャンプの記事',
      url: 'https://note.com/yuta/n/abc',
    });
    expect(r.success).toBe(true);
  });

  it('javascript: を弾く', () => {
    const r = updateSlotSchema.safeParse({
      editPassword: 'pass',
      title: 'わるいリンク',
      url: 'javascript:alert(1)',
    });
    expect(r.success).toBe(false);
  });

  it('ftp:// を弾く', () => {
    const r = updateSlotSchema.safeParse({
      editPassword: 'pass',
      title: 'ftp',
      url: 'ftp://example.com/a',
    });
    expect(r.success).toBe(false);
  });

  it('タイトルが空なら弾く', () => {
    const r = updateSlotSchema.safeParse({ editPassword: 'pass', title: '   ', url: 'https://a.example' });
    expect(r.success).toBe(false);
  });
});

describe('commentSchema', () => {
  it('空白だけの本文を弾く', () => {
    expect(commentSchema.safeParse({ name: 'a', body: '    ' }).success).toBe(false);
  });

  it('名前が空なら「名無し」になる', () => {
    const r = commentSchema.parse({ name: '', body: 'よかった' });
    expect(r.name).toBe('名無し');
  });

  it('名前が無くても「名無し」になる', () => {
    const r = commentSchema.parse({ body: 'よかった' });
    expect(r.name).toBe('名無し');
  });

  it('281文字は弾く', () => {
    expect(commentSchema.safeParse({ name: '', body: 'あ'.repeat(281) }).success).toBe(false);
    expect(commentSchema.safeParse({ name: '', body: 'あ'.repeat(280) }).success).toBe(true);
  });
});

describe('reactionSchema', () => {
  it('5種類以外の絵文字も通す（Slack 式）', () => {
    expect(reactionSchema.safeParse({ emoji: '🍣', clientId: UUID }).success).toBe(true);
    expect(reactionSchema.safeParse({ emoji: '👍🏽', clientId: UUID }).success).toBe(true);
  });

  it('絵文字ではない文字や、2文字以上を弾く', () => {
    expect(reactionSchema.safeParse({ emoji: 'a', clientId: UUID }).success).toBe(false);
    expect(reactionSchema.safeParse({ emoji: '👍👍', clientId: UUID }).success).toBe(false);
    expect(reactionSchema.safeParse({ emoji: '<script>', clientId: UUID }).success).toBe(false);
  });

  it('カスタム絵文字は UUID で指定する', () => {
    expect(reactionSchema.safeParse({ customEmojiId: UUID, clientId: UUID }).success).toBe(true);
    expect(reactionSchema.safeParse({ customEmojiId: 'party', clientId: UUID }).success).toBe(false);
  });

  it('emoji と customEmojiId はどちらか1つだけ', () => {
    expect(reactionSchema.safeParse({ clientId: UUID }).success).toBe(false);
    expect(reactionSchema.safeParse({ emoji: '👍', customEmojiId: UUID, clientId: UUID }).success).toBe(false);
  });

  it('UUIDでない clientId を弾く', () => {
    expect(reactionSchema.safeParse({ emoji: '👍', clientId: 'abc' }).success).toBe(false);
  });
});

describe('emojiNameSchema', () => {
  it('英小文字・数字・_ - の32文字まで（大文字は小文字にそろえる）', () => {
    expect(emojiNameSchema.safeParse('Party-Parrot').data).toBe('party-parrot');
    expect(emojiNameSchema.safeParse('a'.repeat(33)).success).toBe(false);
    expect(emojiNameSchema.safeParse('すし').success).toBe(false);
    expect(emojiNameSchema.safeParse('').success).toBe(false);
  });
});

describe('daySchema', () => {
  it('1〜25 だけを通す', () => {
    expect(daySchema.safeParse('1').success).toBe(true);
    expect(daySchema.safeParse('25').success).toBe(true);
    expect(daySchema.safeParse('0').success).toBe(false);
    expect(daySchema.safeParse('26').success).toBe(false);
    expect(daySchema.safeParse('abc').success).toBe(false);
  });
});

describe('reserveSchema', () => {
  it('4文字未満のパスワードを弾く', () => {
    expect(reserveSchema.safeParse({ authorName: 'yuta', editPassword: 'abc' }).success).toBe(false);
  });

  it('名前が31文字なら弾く', () => {
    expect(reserveSchema.safeParse({ authorName: 'あ'.repeat(31), editPassword: 'abcd' }).success).toBe(false);
  });
});

describe('adminSlotPatchSchema', () => {
  it('url を null にできる', () => {
    expect(adminSlotPatchSchema.safeParse({ url: null }).success).toBe(true);
  });

  it('危険なURLは管理者でも弾く', () => {
    expect(adminSlotPatchSchema.safeParse({ url: 'javascript:alert(1)' }).success).toBe(false);
  });
});
