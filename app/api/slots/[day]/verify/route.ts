import type { NextRequest } from 'next/server';
import { apiError } from '@/lib/errors';
import { verifyPassword } from '@/lib/password';
import { parseBody, parseDay, withErrorHandling } from '@/lib/request';
import { db } from '@/lib/supabase';
import { passwordOnlySchema } from '@/lib/validation';

type Ctx = { params: { day: string } };

/** 編集画面のロック解除。本人なので公開前でも title/url を返す */
export const POST = withErrorHandling(async (req: NextRequest, { params }: Ctx) => {
  const day = parseDay(params.day);
  const { editPassword } = await parseBody(req, passwordOnlySchema);

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

  return Response.json({
    day: data.day,
    authorName: data.author_name,
    title: data.title,
    url: data.url,
  });
});
