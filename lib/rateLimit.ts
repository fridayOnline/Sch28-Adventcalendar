import 'server-only';
import { db } from '@/lib/supabase';

type Action = 'reserve' | 'comment' | 'reaction' | 'emoji_upload' | 'admin_login' | 'edit_password';

const LIMITS: Record<Action, { max: number; windowSec: number }> = {
  reserve: { max: 5, windowSec: 10 * 60 },
  comment: { max: 3, windowSec: 60 },
  reaction: { max: 30, windowSec: 60 },
  emoji_upload: { max: 5, windowSec: 60 * 60 },
  admin_login: { max: 5, windowSec: 10 * 60 },
  // 編集用パスワードを「間違えた」回数（正しいときは数えない）。仮パスワードの総当たり対策
  edit_password: { max: 10, windowSec: 10 * 60 },
};

/** 上限以上なら true（制限に引っかかった）。未満なら行を足して false */
export async function hitRateLimit(ipHash: string, action: Action): Promise<boolean> {
  const { max, windowSec } = LIMITS[action];
  const since = new Date(Date.now() - windowSec * 1000).toISOString();
  const supabase = db();

  const { count, error } = await supabase
    .from('rate_limits')
    .select('id', { count: 'exact', head: true })
    .eq('ip_hash', ipHash)
    .eq('action', action)
    .gte('created_at', since);

  if (error) {
    console.error('[rateLimit] count failed', error);
    return false; // 数えられないときは通す（可用性優先）
  }
  if ((count ?? 0) >= max) return true;

  await supabase.from('rate_limits').insert({ ip_hash: ipHash, action });

  // 古い行の掃除（1%の確率）。cronは使わない
  if (Math.random() < 0.01) {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    await supabase.from('rate_limits').delete().lt('created_at', cutoff);
  }
  return false;
}

/** 数えるだけ（行は足さない）。上限以上なら true */
export async function isRateLimited(ipHash: string, action: Action): Promise<boolean> {
  const { max, windowSec } = LIMITS[action];
  const since = new Date(Date.now() - windowSec * 1000).toISOString();
  const { count, error } = await db()
    .from('rate_limits')
    .select('id', { count: 'exact', head: true })
    .eq('ip_hash', ipHash)
    .eq('action', action)
    .gte('created_at', since);
  if (error) {
    console.error('[rateLimit] count failed', error);
    return false;
  }
  return (count ?? 0) >= max;
}

/** 1回分を記録する（失敗したときだけ数えたい操作用） */
export async function recordAttempt(ipHash: string, action: Action): Promise<void> {
  const { error } = await db().from('rate_limits').insert({ ip_hash: ipHash, action });
  if (error) console.error('[rateLimit] insert failed', error);
}
