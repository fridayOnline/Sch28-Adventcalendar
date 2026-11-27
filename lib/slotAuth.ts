import 'server-only';
import type { NextRequest } from 'next/server';
import { apiError } from '@/lib/errors';
import { verifyPassword } from '@/lib/password';
import { isRateLimited, recordAttempt } from '@/lib/rateLimit';
import { getIpHash } from '@/lib/request';
import { db } from '@/lib/supabase';

/**
 * 編集用パスワードを確かめて枠を返す（/edit のロック解除・保存・取り消し・パスワード変更で共通）。
 * 間違えた回数だけを IP ごとに数え、10分に10回を超えたら 429 にする。
 */
export async function loadSlotWithPassword(
  req: NextRequest,
  calendar: number,
  day: number,
  editPassword: string,
) {
  const ipHash = getIpHash(req);
  if (await isRateLimited(ipHash, 'edit_password')) throw apiError('RATE_LIMITED');

  const { data, error } = await db()
    .from('slots')
    .select('calendar, day, author_name, title, url, edit_key_hash')
    .eq('calendar', calendar)
    .eq('day', day)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw apiError('NOT_FOUND');
  if (!(await verifyPassword(editPassword, data.edit_key_hash as string))) {
    await recordAttempt(ipHash, 'edit_password');
    throw apiError('WRONG_PASSWORD');
  }
  return data;
}
