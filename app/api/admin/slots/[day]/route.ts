import { revalidatePath } from 'next/cache';
import type { NextRequest } from 'next/server';
import { apiError } from '@/lib/errors';
import { requireAdmin } from '@/lib/requireAdmin';
import { parseBody, parseDay, withErrorHandling } from '@/lib/request';
import { db } from '@/lib/supabase';
import { adminSlotPatchSchema } from '@/lib/validation';

type Ctx = { params: Promise<{ day: string }> };

/** 渡された項目だけ更新 */
export const PATCH = withErrorHandling(async (req: NextRequest, { params }: Ctx) => {
  await requireAdmin();
  const day = parseDay((await params).day);
  const patch = await parseBody(req, adminSlotPatchSchema);

  const update: Record<string, unknown> = {};
  if (patch.authorName !== undefined) update.author_name = patch.authorName;
  if (patch.title !== undefined) update.title = patch.title;
  if (patch.url !== undefined) update.url = patch.url;
  if (patch.hidden !== undefined) update.hidden = patch.hidden;

  if (Object.keys(update).length === 0) {
    throw apiError('VALIDATION_ERROR', '更新する項目がありません');
  }

  const { data, error } = await db()
    .from('slots')
    .update(update)
    .eq('day', day)
    .select('day')
    .maybeSingle();
  if (error) throw error;
  if (!data) throw apiError('NOT_FOUND');

  revalidatePath('/');
  revalidatePath(`/day/${day}`);
  return Response.json({ day });
});

/** 公開後でも削除できる（コメント・リアクションも消える） */
export const DELETE = withErrorHandling(async (_req: NextRequest, { params }: Ctx) => {
  await requireAdmin();
  const day = parseDay((await params).day);

  const { error } = await db().from('slots').delete().eq('day', day);
  if (error) throw error;

  revalidatePath('/');
  revalidatePath(`/day/${day}`);
  return new Response(null, { status: 204 });
});
