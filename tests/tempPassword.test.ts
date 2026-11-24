import { describe, expect, it } from 'vitest';
import { generateTempPassword, TEMP_PASSWORD_WORDS } from '@/lib/tempPassword';
import { changePasswordSchema, passwordOnlySchema } from '@/lib/validation';

describe('generateTempPassword', () => {
  it('「単語-4桁-単語」の形で、編集用パスワードとして通る', () => {
    for (let i = 0; i < 200; i++) {
      const pw = generateTempPassword();
      const m = pw.match(/^([a-z]+)-(\d{4})-([a-z]+)$/);
      expect(m).not.toBeNull();
      expect(TEMP_PASSWORD_WORDS).toContain(m![1]);
      expect(TEMP_PASSWORD_WORDS).toContain(m![3]);
      expect(passwordOnlySchema.safeParse({ editPassword: pw }).success).toBe(true);
    }
  });

  it('毎回ちがうものが出る', () => {
    const set = new Set(Array.from({ length: 200 }, generateTempPassword));
    expect(set.size).toBeGreaterThan(195);
  });

  it('単語リストに重複がない', () => {
    expect(new Set(TEMP_PASSWORD_WORDS).size).toBe(TEMP_PASSWORD_WORDS.length);
  });
});

describe('changePasswordSchema', () => {
  it('4文字以上の新しいパスワードを通す', () => {
    expect(changePasswordSchema.safeParse({ editPassword: 'hoshi-0001-mikan', newPassword: 'mypass' }).success).toBe(true);
  });
  it('短すぎるパスワードは弾く', () => {
    expect(changePasswordSchema.safeParse({ editPassword: 'oldpass', newPassword: 'abc' }).success).toBe(false);
  });
  it('今と同じパスワードは弾く', () => {
    const r = changePasswordSchema.safeParse({ editPassword: 'samepass', newPassword: 'samepass' });
    expect(r.success).toBe(false);
  });
});
