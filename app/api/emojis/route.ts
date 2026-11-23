import { revalidatePath } from 'next/cache';
import type { NextRequest } from 'next/server';
import { EMOJI_UPLOAD_MAX_BYTES, EMOJI_UPLOAD_TYPES } from '@/lib/emoji';
import { toEmojiWebp } from '@/lib/emojiImage';
import { apiError } from '@/lib/errors';
import { emojiUrl, listCustomEmojis } from '@/lib/queries';
import { hitRateLimit } from '@/lib/rateLimit';
import { getIpHash, withErrorHandling } from '@/lib/request';
import { db } from '@/lib/supabase';
import { emojiNameSchema } from '@/lib/validation';

export const dynamic = 'force-dynamic';

/** 登録できるカスタム絵文字の総数（荒らし対策） */
const MAX_CUSTOM_EMOJIS = 300;

/** カスタム絵文字の一覧（ピッカー用） */
export const GET = withErrorHandling(async () => {
  return Response.json({ emojis: await listCustomEmojis() });
});

/** カスタム絵文字の登録（multipart/form-data: name, file） */
export const POST = withErrorHandling(async (req: NextRequest) => {
  const form = await req.formData().catch(() => null);
  if (!form) throw apiError('VALIDATION_ERROR', '画像と名前を送ってください');

  const name = emojiNameSchema.safeParse(form.get('name'));
  if (!name.success) throw apiError('VALIDATION_ERROR', name.error.issues[0]?.message);

  const file = form.get('file');
  if (!(file instanceof File) || file.size === 0) throw apiError('VALIDATION_ERROR', '画像を選んでください');
  if (file.size > EMOJI_UPLOAD_MAX_BYTES) throw apiError('VALIDATION_ERROR', '画像は256KBまでです');
  if (!(EMOJI_UPLOAD_TYPES as readonly string[]).includes(file.type)) {
    throw apiError('VALIDATION_ERROR', 'PNG・JPEG・GIF・WebP の画像だけ使えます');
  }

  const supabase = db();
  const { data: taken, error: e1 } = await supabase
    .from('custom_emojis')
    .select('id')
    .eq('name', name.data)
    .maybeSingle();
  if (e1) throw e1;
  if (taken) throw apiError('EMOJI_NAME_TAKEN');

  const { count, error: e2 } = await supabase
    .from('custom_emojis')
    .select('id', { count: 'exact', head: true });
  if (e2) throw e2;
  if ((count ?? 0) >= MAX_CUSTOM_EMOJIS) {
    throw apiError('VALIDATION_ERROR', '登録できるカスタム絵文字の上限に達しました');
  }

  const ipHash = getIpHash(req);
  if (await hitRateLimit(ipHash, 'emoji_upload')) throw apiError('RATE_LIMITED');

  // 実際にデコードして 128x128 の WebP に作り直したものだけを保存する
  const webp = await toEmojiWebp(Buffer.from(await file.arrayBuffer()));

  const id = crypto.randomUUID();
  const path = `${id}.webp`;
  const { error: upErr } = await supabase.storage
    .from('emojis')
    .upload(path, webp, { contentType: 'image/webp', cacheControl: '31536000', upsert: false });
  if (upErr) throw upErr;

  const { error: insErr } = await supabase
    .from('custom_emojis')
    .insert({ id, name: name.data, path, ip_hash: ipHash });
  if (insErr) {
    await supabase.storage.from('emojis').remove([path]);
    if (insErr.code === '23505') throw apiError('EMOJI_NAME_TAKEN');
    throw insErr;
  }

  revalidatePath('/day/[day]', 'page');
  return Response.json({ id, name: name.data, url: emojiUrl(path) }, { status: 201 });
});
