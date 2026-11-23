import { revalidatePath } from 'next/cache';
import type { NextRequest } from 'next/server';
import { apiError } from '@/lib/errors';
import { hashPassword, verifyPassword } from '@/lib/password';
import { isPublished } from '@/lib/publish';
import { isEntryOpen } from '@/lib/queries';
import { hitRateLimit } from '@/lib/rateLimit';
import { getIpHash, parseBody, parseDay, withErrorHandling } from '@/lib/request';
import { db } from '@/lib/supabase';
import { passwordOnlySchema, reserveSchema, updateSlotSchema } from '@/lib/validation';

type Ctx = { params: Promise<{ day: string }> };

/** 枠の予約 */
export const POST = withErrorHandling(async (req: NextRequest, { params }: Ctx) => {
  const day = parseDay((await params).day);

  if (!(await isEntryOpen())) throw apiError('ENTRY_CLOSED');
  if (await hitRateLimit(getIpHash(req), 'reserve')) throw apiError('RATE_LIMITED');

  const { authorName, editPassword } = await parseBody(req, reserveSchema);
  const editKeyHash = await hashPassword(editPassword);

  // 「空いているか確認してから入れる」の2段階にしない。INSERT一発にしてPKで弾く
  const { error } = await db()
    .from('slots')
    .insert({ day, author_name: authorName, edit_key_hash: editKeyHash });

  if (error) {
    if (error.code === '23505') throw apiError('SLOT_TAKEN');
    throw error;
  }

  revalidatePath('/');
  return Response.json({ day, authorName }, { status: 201 });
});

async function loadSlotOrThrow(day: number, editPassword: string) {
  const { data, error } = await db()
    .from('slots')
    .select('day, author_name, title, url, edit_key_hash')
    .eq('day', day)
    .maybeSingle();
  if (error) throw error;
  if (!data) throw apiError('NOT_FOUND');
  if (!(await verifyPassword(editPassword, data.edit_key_hash as string))) {
    throw apiError('WRONG_PASSWORD');
  }
  return data;
}

/** 記事の登録・編集 */
export const PUT = withErrorHandling(async (req: NextRequest, { params }: Ctx) => {
  const day = parseDay((await params).day);
  const { editPassword, title, url } = await parseBody(req, updateSlotSchema);
  await loadSlotOrThrow(day, editPassword);

  const { error } = await db().from('slots').update({ title, url }).eq('day', day);
  if (error) throw error;

  revalidatePath('/');
  revalidatePath(`/day/${day}`);
  return Response.json({ day, title, url });
});

/** 予約の取り消し */
export const DELETE = withErrorHandling(async (req: NextRequest, { params }: Ctx) => {
  const day = parseDay((await params).day);
  const { editPassword } = await parseBody(req, passwordOnlySchema);
  await loadSlotOrThrow(day, editPassword);

  // 公開後に消すとコメントも消えるので、管理者だけが消せる
  if (isPublished(day)) throw apiError('ALREADY_PUBLISHED');

  const { error } = await db().from('slots').delete().eq('day', day);
  if (error) throw error;

  revalidatePath('/');
  return new Response(null, { status: 204 });
});
