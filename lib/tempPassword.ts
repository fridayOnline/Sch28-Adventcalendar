import 'server-only';
import { randomInt } from 'node:crypto';

/**
 * 管理者が再発行する仮パスワード。口頭や DM で伝えやすいよう「単語-4桁の数字-単語」の形にする。
 * 例: hoshi-4821-mikan
 * 単語 64 語 × 64 語 × 10000 通り ≈ 4,100 万通り。総当たりは編集用パスワードの試行回数制限で止める。
 */
const WORDS = [
  'akari', 'ame', 'ao', 'asa', 'bara', 'botan', 'chizu', 'daichi',
  'fuyu', 'gin', 'hana', 'hare', 'hikari', 'hoshi', 'ichigo', 'iruka',
  'kaede', 'kaze', 'kiku', 'kinoko', 'kitsune', 'koala', 'kumo', 'kuri',
  'kuma', 'maru', 'matcha', 'mikan', 'midori', 'mizu', 'mochi', 'momo',
  'mori', 'nami', 'natsu', 'neko', 'niji', 'nori', 'ocha', 'pan',
  'panda', 'raku', 'ringo', 'risu', 'sakura', 'sora', 'suika', 'sumire',
  'taiyo', 'take', 'tanuki', 'tori', 'tsuki', 'uni', 'umi', 'usagi',
  'wani', 'yama', 'yuki', 'yume', 'yuzu', 'zou', 'kame', 'shiro',
] as const;

export function generateTempPassword(): string {
  const w = () => WORDS[randomInt(WORDS.length)];
  const n = String(randomInt(10000)).padStart(4, '0');
  return `${w()}-${n}-${w()}`;
}

export const TEMP_PASSWORD_WORDS = WORDS;
