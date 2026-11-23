# Sch28-Adventcalendar

アドベントカレンダー Webサイト（2026/12/1〜12/25）。
`doc/` の要件定義書・基本設計書・詳細設計書をもとに実装したもの。

## 技術構成

Next.js 14（App Router）+ Supabase（PostgreSQL）+ Vercel。
ブラウザが Supabase に直接つながることはない。ページは Server Components が DB を読んで HTML を返し、
書き込みは Route Handlers が検証してから service role キーで DB に書く。

## セットアップ

1. 依存をインストール

```bash
npm install
```

2. Supabase でプロジェクトを作り、`supabase/migrations/0001_init.sql` を SQL Editor に貼って実行する

3. `.env.example` をコピーして `.env.local` を作り、値を埋める

```bash
cp .env.example .env.local
```

| 変数 | 用途 |
| --- | --- |
| `SUPABASE_URL` | Supabase のプロジェクトURL |
| `SUPABASE_SERVICE_ROLE_KEY` | サーバー専用キー（絶対に公開しない。`NEXT_PUBLIC_` を付けない） |
| `ADMIN_PASSWORD` | 管理画面のパスワード |
| `SESSION_SECRET` | 管理者JWTの署名用（32文字以上のランダム文字列） |
| `IP_HASH_SALT` | IPハッシュ用のソルト |
| `EVENT_YEAR` | 開催年（2026） |

4. 開発サーバーを起動

```bash
npm run dev
```

## 日付とモックデータを切り替えてローカル確認する

開発時だけ使える環境変数が2つある（`NODE_ENV=production` では無視される）。

| 変数 | 内容 |
| --- | --- |
| `DEV_NOW` | 「今」を固定する。公開判定・今日の箱・カウントダウンがすべてこの時刻で動く |
| `DEV_MOCK_DATA=1` | Supabase につながず、モックデータ入りのインメモリDB（`lib/mockDb.ts`）で動く。予約・編集・コメント・リアクションも動き、再起動でシードに戻る。モック枠の編集用パスワードは `test` |

```bash
npm run dev:mock                                          # 12/12 09:00 ＋ モックデータ
DEV_NOW=2026-12-25T00:00:00+09:00 npm run dev:mock        # 日付だけ変える
DEV_NOW=2026-12-12T09:00:00+09:00 npm run dev             # 本物のDBのまま日付だけ変える
```

効いているときは画面右下に `MOCK DATA / 今 = …` のバッジが出る。
`next dev` を同じフォルダで2つ同時に起動すると `.next` が壊れるので、通常の dev と dev:mock はどちらか一方だけ動かす。

## コマンド

| コマンド | 内容 |
| --- | --- |
| `npm run dev` | 開発サーバー |
| `npm run dev:mock` | 12/12 の時刻＋モックデータで開発サーバー（下記） |
| `npm run build` | 本番ビルド（`/` を事前生成するので Supabase に接続できる必要がある） |
| `npm run test` | 単体テスト（Vitest） |

## 画面

| パス | 画面 |
| --- | --- |
| `/` | カレンダー。25マス。空き枠は「募集中」 |
| `/day/[day]` | その日の詳細。リアクションとコメント（公開前は Coming soon のみ） |
| `/entry?day=N` | 枠の予約。`day` なしなら空き日の一覧から選ぶ |
| `/edit?day=N` | 記事の登録・編集。編集用パスワードでロック解除 |
| `/admin` | 管理画面。リンクは置かず、URLを直接開く |

## 公開判定

`isPublished(day)` = 現在時刻 ≧ `{EVENT_YEAR}-12-{day}T00:00:00+09:00`。
サーバーでだけ判定し、公開前の `title` / `url` はレスポンスに含めない（ブラウザ側で隠すのではなく、そもそも送らない）。
カレンダーは `revalidate = 60` なので、0:00を過ぎてから最大1分で切り替わる。

## デザイン

`public/assets/` の素材（240×300 のレイヤー）をそのまま重ねて箱を組み立てている。

| 状態 | 見た目 |
| --- | --- |
| open（募集中） | ふたが閉じた箱。紐なし、点線枠で薄く |
| reserved（予約済み） | ふたが閉じた箱＋十字の紐とリボン（`twine_*`, `twine_bow`） |
| published（公開済み） | ふたが上辺を軸に開き、赤い内側とその日のお菓子（`sweet_NN`）が見える |

日付ごとのお菓子は `sweet_01`〜`sweet_25`、ふたの番号は `flap_front_01`〜`flap_front_25` が1日ずつ対応する。
`cell_inside.png` は陰影だけの素材なので、`#862925` の上に乗算で重ねている。

2026年12月1日は火曜日なので、グリッドの先頭に空マスを2つ入れている（`leadingPadCount()`）。

## セキュリティ

- 編集用パスワードは bcrypt（cost 10）で保存し、PUT / DELETE のたびに照合する
- 全テーブルで RLS を有効にしてポリシーを作らない。アクセスはサーバーから service role キーでだけ
- URLは `http(s)://` のみ許可。`javascript:` は zod と DB の CHECK 制約で二重に弾く
- 外部リンクは `target="_blank" rel="noopener noreferrer"`
- コメントは React のテキストとして表示し、`dangerouslySetInnerHTML` は使わない
- IPは平文で保存せず `sha256(IP + IP_HASH_SALT)` で持つ
- レート制限：予約 5回/10分、コメント 3回/1分、リアクション 30回/1分、管理ログイン 5回/10分
