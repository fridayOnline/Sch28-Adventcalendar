import { revalidatePath } from 'next/cache';
import type { NextRequest } from 'next/server';
import { apiError } from '@/lib/errors';
import { isPublished } from '@/lib/publish';
import { getReactionState } from '@/lib/queries';
import { hitRateLimit } from '@/lib/rateLimit';
import { getIpHash, parseBody, parseDay, withErrorHandling } from '@/lib/request';
import { db } from '@/lib/supabase';
import { reactionSchema } from '@/lib/validation';

type Ctx = { params: { day: string } };

export const POST = withErrorHandling(async (req: NextRequest, { params }: Ctx) => {
  const day = parseDay(params.day);
  if (!isPublished(day)) throw apiError('NOT_PUBLISHED');

  const supabase = db();
  const { data: slot, error: slotError } = await supabase
    .from('slots')
    .select('day, hidden')
    .eq('day', day)
    .maybeSingle();
  if (slotError) throw slotError;
  if (!slot || slot.hidden) throw apiError('NOT_PUBLISHED');

  if (await hitRateLimit(getIpHash(req), 'reaction')) throw apiError('RATE_LIMITED');

  const { emoji, clientId } = await parseBody(req, reactionSchema);

  // insert ... on conflict do nothing で挑戦し、入らなかったら既に押していたので delete（トグル）
  const { data: inserted, error } = await supabase
    .from('reactions')
    .upsert({ day, emoji, client_id: clientId }, { onConflict: 'day,emoji,client_id', ignoreDuplicates: true })
    .select('emoji');
  if (error) throw error;

  if (!inserted || inserted.length === 0) {
    const { error: delError } = await supabase
      .from('reactions')
      .delete()
      .eq('day', day)
      .eq('emoji', emoji)
      .eq('client_id', clientId);
    if (delError) throw delError;
  }

  const state = await getReactionState(day, clientId);
  revalidatePath('/');
  return Response.json(state);
});
