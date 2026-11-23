import { revalidatePath } from 'next/cache';
import type { NextRequest } from 'next/server';
import { apiError } from '@/lib/errors';
import { requireAdmin } from '@/lib/requireAdmin';
import { parseBody, withErrorHandling } from '@/lib/request';
import { db } from '@/lib/supabase';
import { adminCommentPatchSchema } from '@/lib/validation';

type Ctx = { params: Promise<{ id: string }> };

export const PATCH = withErrorHandling(async (req: NextRequest, { params }: Ctx) => {
  await requireAdmin();
  const { hidden } = await parseBody(req, adminCommentPatchSchema);

  const { data, error } = await db()
    .from('comments')
    .update({ hidden })
    .eq('id', (await params).id)
    .select('id, day')
    .maybeSingle();
  if (error) throw error;
  if (!data) throw apiError('NOT_FOUND');

  revalidatePath('/');
  revalidatePath(`/day/${data.day}`);
  return Response.json({ id: data.id, hidden });
});

export const DELETE = withErrorHandling(async (_req: NextRequest, { params }: Ctx) => {
  await requireAdmin();

  const { data, error } = await db()
    .from('comments')
    .delete()
    .eq('id', (await params).id)
    .select('day')
    .maybeSingle();
  if (error) throw error;
  if (!data) throw apiError('NOT_FOUND');

  revalidatePath('/');
  revalidatePath(`/day/${data.day}`);
  return new Response(null, { status: 204 });
});
