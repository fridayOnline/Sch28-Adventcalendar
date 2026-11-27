import type { NextRequest } from 'next/server';
import { apiError } from '@/lib/errors';
import { hashPassword } from '@/lib/password';
import { requireAdmin } from '@/lib/requireAdmin';
import { parseCal, parseDay, withErrorHandling } from '@/lib/request';
import { db } from '@/lib/supabase';
import { generateTempPassword } from '@/lib/tempPassword';

type Ctx = { params: Promise<{ day: string }> };

/**
 * 編集用パスワードの再発行（管理者のみ）。
 * 元のパスワードは bcrypt で一方向に変換して保存しているので見せられない。代わりに仮パスワードを作って置き換え、
 * この応答で 1 回だけ返す（DB にはハッシュしか残らない）。古いパスワードはこの時点で使えなくなる。
 */
export const POST = withErrorHandling(async (req: NextRequest, { params }: Ctx) => {
  await requireAdmin();
  const day = parseDay((await params).day);
  const calendar = parseCal(req);

  const tempPassword = generateTempPassword();
  const { data, error } = await db()
    .from('slots')
    .update({ edit_key_hash: await hashPassword(tempPassword) })
    .eq('calendar', calendar)
    .eq('day', day)
    .select('day')
    .maybeSingle();
  if (error) throw error;
  if (!data) throw apiError('NOT_FOUND');

  return Response.json(
    { calendar, day, tempPassword },
    { headers: { 'cache-control': 'no-store' } },
  );
});
