import type { NextRequest } from 'next/server';
import { hashPassword } from '@/lib/password';
import { parseBody, parseDay, withErrorHandling } from '@/lib/request';
import { loadSlotWithPassword } from '@/lib/slotAuth';
import { db } from '@/lib/supabase';
import { changePasswordSchema } from '@/lib/validation';

type Ctx = { params: Promise<{ day: string }> };

/** 本人によるパスワード変更。今のパスワード（管理者が発行した仮パスワードでもよい）を確かめてから変える */
export const POST = withErrorHandling(async (req: NextRequest, { params }: Ctx) => {
  const day = parseDay((await params).day);
  const { editPassword, newPassword } = await parseBody(req, changePasswordSchema);
  await loadSlotWithPassword(req, day, editPassword);

  const { error } = await db()
    .from('slots')
    .update({ edit_key_hash: await hashPassword(newPassword) })
    .eq('day', day);
  if (error) throw error;

  return new Response(null, { status: 204 });
});
