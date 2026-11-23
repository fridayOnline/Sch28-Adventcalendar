import { revalidatePath } from 'next/cache';
import type { NextRequest } from 'next/server';
import { apiError } from '@/lib/errors';
import { requireAdmin } from '@/lib/requireAdmin';
import { withErrorHandling } from '@/lib/request';
import { db } from '@/lib/supabase';

type Ctx = { params: Promise<{ id: string }> };

/** カスタム絵文字の削除。その絵文字で付いていたリアクションも消える（ON DELETE CASCADE） */
export const DELETE = withErrorHandling(async (_req: NextRequest, { params }: Ctx) => {
  await requireAdmin();

  const supabase = db();
  const { data, error } = await supabase
    .from('custom_emojis')
    .delete()
    .eq('id', (await params).id)
    .select('path')
    .maybeSingle();
  if (error) throw error;
  if (!data) throw apiError('NOT_FOUND');

  const { error: rmErr } = await supabase.storage.from('emojis').remove([data.path as string]);
  if (rmErr) console.error('[admin/emojis] storage remove failed', rmErr);

  revalidatePath('/');
  revalidatePath('/day/[day]', 'page');
  return new Response(null, { status: 204 });
});
