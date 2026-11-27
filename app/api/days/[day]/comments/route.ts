import { revalidatePath } from 'next/cache';
import type { NextRequest } from 'next/server';
import { apiError } from '@/lib/errors';
import { isPublished } from '@/lib/publish';
import { hitRateLimit } from '@/lib/rateLimit';
import { getIpHash, parseBody, parseCal, parseDay, withErrorHandling } from '@/lib/request';
import { db } from '@/lib/supabase';
import { commentSchema } from '@/lib/validation';

type Ctx = { params: Promise<{ day: string }> };

export const POST = withErrorHandling(async (req: NextRequest, { params }: Ctx) => {
  const day = parseDay((await params).day);
  const calendar = parseCal(req);
  if (!isPublished(day)) throw apiError('NOT_PUBLISHED');

  const supabase = db();
  const { data: slot, error: slotError } = await supabase
    .from('slots')
    .select('day, hidden')
    .eq('calendar', calendar)
    .eq('day', day)
    .maybeSingle();
  if (slotError) throw slotError;
  if (!slot || slot.hidden) throw apiError('NOT_PUBLISHED');

  const ipHash = getIpHash(req);
  if (await hitRateLimit(ipHash, 'comment')) throw apiError('RATE_LIMITED');

  const { name, body } = await parseBody(req, commentSchema);

  const { data, error } = await supabase
    .from('comments')
    .insert({ calendar, day, name, body, ip_hash: ipHash })
    .select('id, name, body, created_at')
    .single();
  if (error) throw error;

  revalidatePath('/');
  revalidatePath(`/day/${day}`);

  return Response.json(
    { id: data.id, name: data.name, body: data.body, createdAt: data.created_at },
    { status: 201 },
  );
});
