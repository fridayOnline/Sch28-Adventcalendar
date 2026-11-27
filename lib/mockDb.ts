import 'server-only';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import bcrypt from 'bcryptjs';
import type { SupabaseClient } from '@supabase/supabase-js';
import { currentTime, eventYear, publishAt } from '@/lib/publish';

/**
 * 開発用のインメモリDB（DEV_MOCK_DATA=1 のときだけ使う）。
 * lib/ と app/api/ で使っている supabase-js のメソッドだけを真似して、Supabase に一切つながずに動かす。
 * データは dev サーバーのプロセス内にだけあり、再起動するとシードに戻る。
 * モックの枠の編集用パスワードはすべて MOCK_PASSWORD。
 * Storage（カスタム絵文字の画像）もメモリに置き、公開URLの代わりに data: URL を返す（配信用のルートは要らない）。
 */

export const MOCK_PASSWORD = 'test';

type Row = Record<string, unknown>;
type Tables = Record<'slots' | 'comments' | 'reactions' | 'custom_emojis' | 'settings' | 'rate_limits', Row[]>;
type StoredObject = { body: Buffer; contentType: string };
type Result = { data: unknown; error: { code?: string; message: string } | null; count?: number | null };

// ---------- シードデータ ----------

// 1枚目は25日すべて埋まっている（本番で満員になった状態の確認用）。2枚目は空きあり
const SEED: [calendar: number, day: number, author: string, title: string | null][] = ([
  [1, 'yuta', '冬キャンプで焚き火をするために覚えたこと'],
  [2, 'mio', 'ギター初心者が1年でFコードを押さえるまで'],
  [3, 'kenta', '近所の銭湯を20軒まわってみた'],
  [4, 'sora', 'ポケカの環境デッキを語る'],
  [5, 'hana', 'はじめてのパン作り記録'],
  [6, 'riku', '自作キーボード沼の入口'],
  [7, 'aoi', '推しの聖地巡礼・関西編'],
  [8, 'yuta', 'Blenderで雪だるまを作る'],
  [9, 'mio', 'フィルムカメラで撮る冬の街'],
  [10, 'taku', null], // URL未登録（「記事準備中」の確認用）
  [11, 'mei', '手帳を1年使い切るコツ'],
  [12, 'haru', 'ボドゲ会を10回開いてわかったこと'],
  [13, 'yui', '観葉植物を枯らさないコツ'],
  [14, 'aoi', '純喫茶のプリンを食べ比べ'],
  [15, 'kenta', 'ラーメン二郎の全店制覇計画'],
  [16, 'nana', '朝ランを半年続けた話'],
  [17, 'taku', 'ミニ四駆に再入門した'],
  [18, 'sora', 'レトロゲーム互換機くらべ'],
  [19, 'ren', '自宅サーバーをRaspberry Piで'],
  [20, 'yui', '冬の星座を見に行く'],
  [21, 'hana', 'シュトーレンを焼く'],
  [22, 'haru', 'マーダーミステリーのすすめ'],
  [23, 'riku', '万年筆インクの沼'],
  [24, 'yuta', 'クリスマスに観たい映画10本'],
  [25, 'mio', '今年いちばん良かった買い物'],
] as const).map(([d, a, t]) => [1, d, a, t] as [number, number, string, string | null]).concat([
  [2, 2, 'kai', 'はじめてのZINE作り'],
  [2, 5, 'rin', null], // 2枚目・URL未登録
  [2, 9, 'sota', '近所の坂道ランキング'],
  [2, 14, 'mio', '刺繍で年賀状を作る'],
  [2, 20, 'kenta', '冬のソロ登山の装備'],
]);

const COMMENTS = [
  ['mio', 'めちゃくちゃわかりやすかったです！'],
  ['名無し', '朝から癒やされた'],
  ['kenta', '一番乗り！'],
  ['sora', '写真がきれい。真似してみます'],
  ['名無し', '続編も読みたいです'],
  ['haru', 'これは沼ですね…'],
];
const EMOJIS = ['👍', '🎉', '😂', '🔥', '❤️'];
// Slack 式リアクションの確認用：5種類以外の絵文字と、カスタム絵文字（お菓子の画像を流用）
const EXTRA_EMOJIS = ['🙌', '👀', '🍣'];
const SEED_CUSTOM: [name: string, asset: string][] = [
  ['candy', 'sweet_01.png'],
  ['lollipop', 'sweet_03.png'],
  ['choco', 'sweet_02.png'],
];

function seed(): Tables {
  const hash = bcrypt.hashSync(MOCK_PASSWORD, 4); // 開発用なので軽いコストで
  const now = currentTime();
  const t: Tables = { slots: [], comments: [], reactions: [], custom_emojis: [], settings: [], rate_limits: [] };

  const customIds: string[] = [];
  for (const [name, asset] of SEED_CUSTOM) {
    const id = crypto.randomUUID();
    const path = `${id}.png`;
    try {
      storage().set(`emojis/${path}`, {
        body: readFileSync(join(process.cwd(), 'public/assets', asset)),
        contentType: 'image/png',
      });
    } catch {
      continue; // 素材が無ければカスタム絵文字のシードは省く
    }
    t.custom_emojis.push({ id, name, path, ip_hash: 'mock', created_at: new Date(Date.UTC(eventYear(), 10, 25)).toISOString() });
    customIds.push(id);
  }

  for (const [calendar, day, author, title] of SEED) {
    const at = new Date(Date.UTC(eventYear(), 10, 20 + (day % 7))).toISOString();
    t.slots.push({
      calendar,
      day,
      author_name: author,
      title,
      url: title ? `https://example.com/advent/${calendar}/${day}` : null,
      edit_key_hash: hash,
      hidden: false,
      created_at: at,
      updated_at: at,
    });

    // 公開済みの日（DEV_NOW 時点）にだけコメントとリアクションを付ける
    const open = publishAt(day);
    if (open > now) continue;
    const nComments = (day * 7) % 5;
    for (let i = 0; i < nComments; i++) {
      const [name, body] = COMMENTS[(day + i) % COMMENTS.length];
      const created = new Date(Math.min(now.getTime(), open.getTime() + (i + 1) * 47 * 60 * 1000));
      t.comments.push({ id: crypto.randomUUID(), calendar, day, name, body, hidden: false, ip_hash: 'mock', created_at: created.toISOString() });
    }
    EMOJIS.forEach((emoji, j) => {
      const n = (day * (j + 3)) % 7;
      for (let k = 0; k < n; k++) {
        t.reactions.push({ calendar, day, emoji, custom_emoji_id: null, client_id: crypto.randomUUID(), created_at: open.toISOString() });
      }
    });
    // 偶数日には 5種類以外の絵文字とカスタム絵文字も付ける（少しあとに押された扱い）
    if (day % 2 === 0) {
      const later = new Date(open.getTime() + 60 * 60 * 1000).toISOString();
      const extra = EXTRA_EMOJIS[day % EXTRA_EMOJIS.length];
      for (let k = 0; k < 1 + (day % 3); k++) {
        t.reactions.push({ calendar, day, emoji: extra, custom_emoji_id: null, client_id: crypto.randomUUID(), created_at: later });
      }
      const cid = customIds[day % Math.max(customIds.length, 1)];
      if (cid) {
        for (let k = 0; k < 1 + (day % 4); k++) {
          t.reactions.push({ calendar, day, emoji: `c:${cid}`, custom_emoji_id: cid, client_id: crypto.randomUUID(), created_at: later });
        }
      }
    }
  }

  t.settings.push({ key: 'entry_open', value: true });
  return t;
}

// HMR でモジュールが読み直されてもデータが消えないよう globalThis に置く
const g = globalThis as unknown as { __adventMockDb?: Tables; __adventMockStorage?: Map<string, StoredObject> };
const storage = () => (g.__adventMockStorage ??= new Map());
const tables = (): Tables => (g.__adventMockDb ??= seed());


const sameSlot = (a: Row, b: Row) => a.calendar === b.calendar && a.day === b.day;

/** slot_summaries ビュー相当 */
function view(name: string): Row[] {
  const t = tables();
  if (name !== 'slot_summaries') return (t as Record<string, Row[]>)[name];
  return t.slots.map((s) => ({
    ...s,
    comment_count: t.comments.filter((c) => sameSlot(c, s) && !c.hidden).length,
    reaction_count: t.reactions.filter((r) => sameSlot(r, s)).length,
  }));
}

// 新しく書き込む行の時刻。DEV_NOW で固定した「今」を起点に、実際の経過時間だけ進める
const BOOT = Date.now();
const mockNow = () => new Date(currentTime().getTime() + (Date.now() - BOOT));

function withDefaults(table: string, row: Row): Row {
  const now = mockNow().toISOString();
  switch (table) {
    case 'slots':
      return { calendar: 1, title: null, url: null, hidden: false, created_at: now, updated_at: now, ...row };
    case 'comments':
      return { id: crypto.randomUUID(), calendar: 1, name: '名無し', hidden: false, created_at: now, ...row };
    case 'custom_emojis':
      return { id: crypto.randomUUID(), created_at: now, ...row };
    case 'reactions':
      return { calendar: 1, custom_emoji_id: null, created_at: now, ...row };
    case 'rate_limits':
      // レート制限は実時計（lib/rateLimit.ts）と比べるので、ここだけ本当の時刻
      return { id: Date.now() + Math.random(), created_at: new Date().toISOString(), ...row };
    default:
      return { created_at: now, ...row };
  }
}

// ---------- クエリビルダー ----------

class Query implements PromiseLike<Result> {
  private op: 'select' | 'insert' | 'update' | 'delete' | 'upsert' | null = null;
  private payload: Row | Row[] = {};
  private filters: ((r: Row) => boolean)[] = [];
  private cols: string[] | null = null;
  private returning = false;
  private countMode = false;
  private head = false;
  private sort: { col: string; asc: boolean } | null = null;
  private max: number | null = null;
  private mode: 'one' | 'maybe' | null = null;
  private upsertOpts: { onConflict?: string; ignoreDuplicates?: boolean } = {};

  constructor(private table: string) {}

  select(cols = '*', opts?: { count?: string; head?: boolean }) {
    if (this.op === null) this.op = 'select';
    else this.returning = true;
    this.cols = cols.trim() === '*' ? null : cols.split(',').map((c) => c.trim());
    this.countMode = !!opts?.count;
    this.head = !!opts?.head;
    return this;
  }
  insert(row: Row | Row[]) { this.op = 'insert'; this.payload = row; return this; }
  update(patch: Row) { this.op = 'update'; this.payload = patch; return this; }
  delete() { this.op = 'delete'; return this; }
  upsert(row: Row, opts: { onConflict?: string; ignoreDuplicates?: boolean } = {}) {
    this.op = 'upsert'; this.payload = row; this.upsertOpts = opts; return this;
  }
  eq(col: string, v: unknown) { this.filters.push((r) => r[col] === v); return this; }
  in(col: string, vs: unknown[]) { this.filters.push((r) => vs.includes(r[col])); return this; }
  gte(col: string, v: string) { this.filters.push((r) => String(r[col]) >= v); return this; }
  lt(col: string, v: string) { this.filters.push((r) => String(r[col]) < v); return this; }
  order(col: string, opts?: { ascending?: boolean }) { this.sort = { col, asc: opts?.ascending ?? true }; return this; }
  limit(n: number) { this.max = n; return this; }
  maybeSingle() { this.mode = 'maybe'; return this; }
  single() { this.mode = 'one'; return this; }

  private pick(rows: Row[]) {
    const cols = this.cols;
    return cols ? rows.map((r) => Object.fromEntries(cols.map((c) => [c, r[c]]))) : rows.map((r) => ({ ...r }));
  }
  private match = (r: Row) => this.filters.every((f) => f(r));

  private run(): Result {
    const t = tables() as Record<string, Row[]>;
    let rows: Row[] = [];

    switch (this.op) {
      case 'select': {
        rows = view(this.table).filter(this.match);
        if (this.sort) {
          const { col, asc } = this.sort;
          rows = [...rows].sort((a, b) => (String(a[col]) < String(b[col]) ? -1 : String(a[col]) > String(b[col]) ? 1 : 0) * (asc ? 1 : -1));
        }
        if (this.max !== null) rows = rows.slice(0, this.max);
        if (this.head) return { data: null, error: null, count: rows.length };
        break;
      }
      case 'insert': {
        const list = Array.isArray(this.payload) ? this.payload : [this.payload];
        for (const raw of list) {
          const row = withDefaults(this.table, raw);
          if (this.table === 'slots' && t.slots.some((s) => sameSlot(s, row))) {
            return { data: null, error: { code: '23505', message: 'duplicate key value violates unique constraint "slots_pkey"' } };
          }
          if (this.table === 'custom_emojis' && t.custom_emojis.some((e) => e.name === row.name)) {
            return { data: null, error: { code: '23505', message: 'duplicate key value violates unique constraint "custom_emojis_name_key"' } };
          }
          t[this.table].push(row);
          rows.push(row);
        }
        break;
      }
      case 'upsert': {
        const row = withDefaults(this.table, this.payload as Row);
        const keys = (this.upsertOpts.onConflict ?? 'key').split(',').map((k) => k.trim());
        const existing = t[this.table].find((r) => keys.every((k) => r[k] === row[k]));
        if (existing) {
          if (!this.upsertOpts.ignoreDuplicates) { Object.assign(existing, this.payload); rows = [existing]; }
        } else {
          t[this.table].push(row);
          rows = [row];
        }
        break;
      }
      case 'update': {
        rows = t[this.table].filter(this.match);
        for (const r of rows) {
          Object.assign(r, this.payload);
          if (this.table === 'slots') r.updated_at = mockNow().toISOString();
        }
        break;
      }
      case 'delete': {
        rows = t[this.table].filter(this.match);
        t[this.table] = t[this.table].filter((r) => !this.match(r));
        if (this.table === 'slots') {
          // ON DELETE CASCADE
          t.comments = t.comments.filter((c) => !rows.some((s) => sameSlot(c, s)));
          t.reactions = t.reactions.filter((r) => !rows.some((s) => sameSlot(r, s)));
        }
        if (this.table === 'custom_emojis') {
          // ON DELETE CASCADE（その絵文字のリアクションも消える）
          const ids = new Set(rows.map((r) => r.id));
          t.reactions = t.reactions.filter((r) => !ids.has(r.custom_emoji_id));
        }
        break;
      }
    }

    if (this.op !== 'select' && !this.returning) return { data: null, error: null };
    const data = this.pick(rows);
    if (this.mode) {
      if (this.mode === 'one' && data.length !== 1) return { data: null, error: { code: 'PGRST116', message: 'no rows' } };
      return { data: data[0] ?? null, error: null };
    }
    return { data, error: null, count: this.countMode ? rows.length : null };
  }

  then<A = Result, B = never>(ok?: ((v: Result) => A | PromiseLike<A>) | null, ng?: ((e: unknown) => B | PromiseLike<B>) | null) {
    return Promise.resolve()
      .then(() => this.run())
      .then(ok, ng);
  }
}

/** supabase.storage.from(bucket) の真似（upload / remove / getPublicUrl だけ） */
function mockBucket(bucket: string) {
  const key = (path: string) => `${bucket}/${path}`;
  return {
    async upload(path: string, body: Buffer | Uint8Array, opts?: { contentType?: string; upsert?: boolean }) {
      if (!opts?.upsert && storage().has(key(path))) {
        return { data: null, error: { statusCode: '409', message: 'The resource already exists' } };
      }
      storage().set(key(path), { body: Buffer.from(body), contentType: opts?.contentType ?? 'application/octet-stream' });
      return { data: { path }, error: null };
    },
    async remove(paths: string[]) {
      for (const p of paths) storage().delete(key(p));
      return { data: paths.map((name) => ({ name })), error: null };
    },
    getPublicUrl(path: string) {
      tables(); // シードの画像を用意させる
      const obj = storage().get(key(path));
      const publicUrl = obj ? `data:${obj.contentType};base64,${obj.body.toString('base64')}` : '';
      return { data: { publicUrl } };
    },
  };
}

export function createMockClient(): SupabaseClient {
  return {
    from: (table: string) => new Query(table),
    storage: { from: mockBucket },
  } as unknown as SupabaseClient;
}
