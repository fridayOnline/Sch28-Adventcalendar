import sharp from 'sharp';
import { describe, expect, it } from 'vitest';
import { EMOJI_SIZE, toEmojiWebp } from '@/lib/emojiImage';
import { ApiException } from '@/lib/errors';

/** 単色の画像を作る */
const solid = (width: number, height: number, color: string) =>
  sharp({ create: { width, height, channels: 4, background: color } });

describe('toEmojiWebp（カスタム絵文字の画像変換）', () => {
  it('PNG を 128x128 の WebP に作り直す（縦横比は保ち、余白は透明）', async () => {
    const png = await solid(300, 200, '#1F5A3D').png().toBuffer();
    const out = await sharp(await toEmojiWebp(png)).metadata();
    expect(out.format).toBe('webp');
    expect([out.width, out.height]).toEqual([EMOJI_SIZE, EMOJI_SIZE]);
    expect(out.hasAlpha).toBe(true);
  });

  it('JPEG も変換でき、位置情報などのメタデータは残さない', async () => {
    const jpeg = await solid(200, 100, '#A8191F')
      .jpeg()
      .withExif({ IFD0: { Copyright: 'secret', Artist: 'someone' } })
      .toBuffer();
    expect((await sharp(jpeg).metadata()).exif).toBeDefined();

    const out = await sharp(await toEmojiWebp(jpeg)).metadata();
    expect(out.format).toBe('webp');
    expect(out.exif).toBeUndefined();
  });

  it('アニメーション GIF は動きを残す（コマ数が変わらない）', async () => {
    const frames = await Promise.all(
      ['#F3C35B', '#1F5A3D', '#A8191F'].map((c) => solid(64, 64, c).png().toBuffer()),
    );
    const gif = await sharp(frames, { join: { animated: true } }).gif().toBuffer();
    expect((await sharp(gif).metadata()).pages).toBe(3);

    const out = await sharp(await toEmojiWebp(gif), { animated: true }).metadata();
    expect(out.format).toBe('webp');
    expect(out.pages).toBe(3);
    expect(out.width).toBe(EMOJI_SIZE);
  });

  it('SVG は拡張子や Content-Type をごまかしても通さない', async () => {
    const svg = Buffer.from(
      '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><script>alert(1)</script><rect width="10" height="10"/></svg>',
    );
    await expect(toEmojiWebp(svg)).rejects.toBeInstanceOf(ApiException);
  });

  it('画像ではないデータ（HTML など）は通さない', async () => {
    await expect(toEmojiWebp(Buffer.from('<html><script>alert(1)</script></html>'))).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
    });
  });

  it('大きすぎる画像（4096x4096 を超える）は通さない', async () => {
    const huge = await solid(5000, 5000, '#ffffff').png({ compressionLevel: 9 }).toBuffer();
    await expect(toEmojiWebp(huge)).rejects.toBeInstanceOf(ApiException);
  });
});
