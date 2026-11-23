/**
 * リアクション用の絵文字まわり（サーバーとブラウザの両方で使う）。
 *
 * リアクションのキー（reactions.emoji 列）は次のどちらか：
 *  - Unicode 絵文字そのもの（例: "👍"）
 *  - カスタム絵文字なら "c:<custom_emojis.id>"
 */

/** 読み上げ用の名前（それ以外の絵文字は絵文字そのものを読ませる） */
export const QUICK_EMOJI_LABELS: Record<string, string> = {
  '👍': 'いいね',
  '🎉': 'おめでとう',
  '😂': 'わらった',
  '🔥': 'アツい',
  '❤️': 'すき',
};

/** 1つの記事に付けられる絵文字の種類の上限（荒らし対策） */
export const MAX_REACTION_KINDS = 30;

/** カスタム絵文字の名前：半角英小文字・数字・_ - で32文字まで */
export const EMOJI_NAME_RE = /^[a-z0-9_-]{1,32}$/;

/** アップロードできる元画像 */
export const EMOJI_UPLOAD_MAX_BYTES = 256 * 1024;
export const EMOJI_UPLOAD_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'] as const;

const CUSTOM_PREFIX = 'c:';
export const customKey = (id: string) => `${CUSTOM_PREFIX}${id}`;
export const isCustomKey = (key: string) => key.startsWith(CUSTOM_PREFIX);

/**
 * 「絵文字1文字ぶん」かどうか。文字や記号をリアクションとして送られないようにする。
 * 肌の色・ZWJ の組み合わせ・国旗・キーキャップ（1️⃣）も1文字として扱う。
 */
export function isSingleEmoji(value: string): boolean {
  if (!value || value.length > 40) return false;
  const graphemes = [...new Intl.Segmenter('en', { granularity: 'grapheme' }).segment(value)];
  if (graphemes.length !== 1) return false;
  return /\p{Extended_Pictographic}|\p{Regional_Indicator}|⃣/u.test(value);
}
