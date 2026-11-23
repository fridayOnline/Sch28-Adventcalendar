import { revalidatePath } from 'next/cache';
import type { NextRequest } from 'next/server';
import { customKey, MAX_REACTION_KINDS } from '@/lib/emoji';
import { apiError } from '@/lib/errors';
import { isPublished } from '@/lib/publish';
import { getReactionItems } from '@/lib/queries';
import { hitRateLimit } from '@/lib/rateLimit';
import { getIpHash, parseBody, parseDay, withErrorHandling } from '@/lib/request';
import { db } from '@/lib/supabase';
import { reactionSchema } from '@/lib/validation';

type Ctx = { params: { day: string } };

/**
 * リアクションのトグル。body は { clientId, emoji } か { clientId, customEmojiId }。
 * 返り値はトグル後のその日のリアクション一覧（{ reactions: ReactionItem[] }）。
 */
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

  const { emoji, customEmojiId, clientId } = await parseBody(req, reactionSchema);

  let key: string;
  if (customEmojiId) {
    const { data: custom, error } = await supabase
      .from('custom_emojis')
      .select('id')
      .eq('id', customEmojiId)
      .maybeSingle();
    if (error) throw error;
    if (!custom) throw apiError('NOT_FOUND', 'その絵文字は削除されました');
    key = customKey(customEmojiId);
  } else {
    key = emoji!;
  }

  // 新しい種類の絵文字を足すときだけ、種類数の上限を確かめる
  const { data: existing, error: exErr } = await supabase.from('reactions').select('emoji').eq('day', day);
  if (exErr) throw exErr;
  const kinds = new Set((existing ?? []).map((r) => r.emoji as string));
  if (!kinds.has(key) && kinds.size >= MAX_REACTION_KINDS) {
    throw apiError('VALIDATION_ERROR', `1つの記事に付けられる絵文字は${MAX_REACTION_KINDS}種類までです`);
  }

  // insert ... on conflict do nothing で挑戦し、入らなかったら既に押していたので delete（トグル）
  const { data: inserted, error } = await supabase
    .from('reactions')
    .upsert(
      { day, emoji: key, client_id: clientId, custom_emoji_id: customEmojiId ?? null },
      { onConflict: 'day,emoji,client_id', ignoreDuplicates: true },
    )
    .select('emoji');
  if (error) throw error;

  if (!inserted || inserted.length === 0) {
    const { error: delError } = await supabase
      .from('reactions')
      .delete()
      .eq('day', day)
      .eq('emoji', key)
      .eq('client_id', clientId);
    if (delError) throw delError;
  }

  const reactions = await getReactionItems(day, clientId);
  revalidatePath('/');
  return Response.json({ reactions });
});
