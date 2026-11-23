import 'server-only';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { createMockClient } from '@/lib/mockDb';

/** 開発時だけ DEV_MOCK_DATA=1 でインメモリのモックDBに切り替える（本番では無視） */
export const isMockData = () =>
  process.env.NODE_ENV !== 'production' && process.env.DEV_MOCK_DATA === '1';

let client: SupabaseClient | null = null;

/** service role キーで作ったサーバー専用クライアント */
export function db(): SupabaseClient {
  if (client) return client;
  if (isMockData()) return (client = createMockClient());
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY が設定されていません');
  }
  client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return client;
}
