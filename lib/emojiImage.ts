import 'server-only';
import sharp, { type Metadata } from 'sharp';
import { apiError } from '@/lib/errors';

const ALLOWED_FORMATS = new Set(['png', 'jpeg', 'gif', 'webp']);
export const EMOJI_SIZE = 128;

/**
 * アップロードされた画像を 128x128 の WebP に作り直す。
 * - 中身の形式は拡張子や Content-Type ではなく、実際にデコードして確かめる（SVG などは通さない）
 * - 作り直すので、位置情報などのメタデータや偽装されたデータは残らない
 * - アニメーション GIF / WebP は動きを残す
 */
export async function toEmojiWebp(input: Buffer): Promise<Buffer> {
  let meta: Metadata;
  try {
    meta = await sharp(input, { limitInputPixels: 4096 * 4096 }).metadata();
  } catch {
    throw apiError('VALIDATION_ERROR', '画像として読み込めませんでした（PNG・JPEG・GIF・WebP に対応）');
  }
  if (!meta.format || !ALLOWED_FORMATS.has(meta.format)) {
    throw apiError('VALIDATION_ERROR', 'PNG・JPEG・GIF・WebP の画像だけ使えます');
  }

  const animated = (meta.pages ?? 1) > 1;
  try {
    return await sharp(input, { animated, limitInputPixels: 4096 * 4096 })
      .autoOrient() // EXIF の向きを反映
      .resize(EMOJI_SIZE, EMOJI_SIZE, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .webp({ quality: 82, effort: 4 })
      .toBuffer();
  } catch {
    throw apiError('VALIDATION_ERROR', '画像を変換できませんでした。別の画像でお試しください');
  }
}
