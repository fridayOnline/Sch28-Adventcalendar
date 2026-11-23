# Sch28-Adventcalendar

アドベントカレンダー Webサイト（2026/12/1〜12/25）。
`doc/` の要件定義書・基本設計書・詳細設計書をもとに実装したもの。

## 技術構成

Next.js 16（App Router・React 19）+ Supabase（PostgreSQL）+ Vercel。
ブラウザが Supabase に直接つながることはない。ページは Server Components が DB を読んで HTML を返し、
書き込みは Route Handlers が検証してから service role キーで DB に書く。

## セットアップ

1. 依存をインストール

```bash
npm install
```

2. Supabase でプロジェクトを作り、`supabase/migrations/` の SQL を番号順（`0001_init.sql` → `0002_custom_emojis.sql`）に SQL Editor に貼って実行する。`0002` で Storage に公開バケット `emojis` もできる

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
`dev:mock` は `.next-mock` にビルドし、ポート 3100 で起動する（`PORT=4000 npm run dev:mock` で変更可）。通常の `npm run dev`（`.next`・3000）と同時に動かしても大丈夫。ただし同じ種類のサーバーを2つ同時に起動するとビルドが壊れるので避ける。

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
| `/day/[day]` | その日の詳細。リアクション（Slack 式・カスタム絵文字あり）とコメント（公開前は Coming soon のみ） |
| `/entry?day=N` | 枠の予約。`day` なしなら空き日の一覧から選ぶ |
| `/edit?day=N` | 記事の登録・編集。編集用パスワードでロック解除 |
| `/admin` | 管理画面。リンクは置かず、URLを直接開く |

## 公開判定

`isPublished(day)` = 現在時刻 ≧ `{EVENT_YEAR}-12-{day}T06:00:00+09:00`（箱は担当日の朝6時に開く。時刻は `lib/publish.ts` の `PUBLISH_HOUR`）。
「今日の箱」（サンタ帽）はJSTの日付で決まるので、0:00〜6:00 は帽子が乗ったまま閉じている。
サーバーでだけ判定し、公開前の `title` / `url` はレスポンスに含めない（ブラウザ側で隠すのではなく、そもそも送らない）。
カレンダーは `revalidate = 60` なので、6:00を過ぎてから最大1分で切り替わる。

## デザイン

`デザインシステム/` のモックと HTML に合わせて、箱は CSS と SVG で描いている（`components/DayCell.tsx`, `components/BoxArt.tsx`）。

| 状態 | 見た目 |
| --- | --- |
| open（募集中） | 淡いクラフト＋濃い破線。「募集中 ＋予約する」 |
| reserved（予約済み） | 十字の紐とリボン、名札、右上に「編集」 |
| published（公開済み） | ふたが上に開き、中は深い赤にその日のお菓子（`public/assets/sweet_NN.png`。絵柄は12種で、13日以降は1日目からくり返し）＋タイトル＋件数 |
| 今日 | サンタ帽＋赤い外枠 |

PC は7列グリッド、640px未満は縦並びリスト。

2026年12月1日は火曜日なので、グリッドの先頭に空マスを2つ入れている（`leadingPadCount()`）。

## リアクション（Slack 式）

- 押されている絵文字だけを、最初に押された順にチップで並べる（件数0のものは出さない）。新しい絵文字は「＋」のピッカーから選ぶ
- ピッカーは2タブ：「絵文字」（emoji-mart の Unicode 絵文字）と「カスタム」（アップロードされた画像）
- 「画像から絵文字を追加」で、名前（半角英小文字・数字・`_-`）と画像を登録 → そのままリアクションになる。登録した絵文字はみんなが使える
- `reactions.emoji` は Unicode 絵文字そのものか `c:<custom_emojis.id>`。カスタム絵文字を消すと、そのリアクションも消える（ON DELETE CASCADE）
- 管理画面でカスタム絵文字の一覧と削除ができる

| メソッド | パス | 内容 |
| --- | --- | --- |
| GET | `/api/emojis` | カスタム絵文字の一覧 |
| POST | `/api/emojis` | 登録（multipart：`name`, `file`） |
| POST | `/api/days/[day]/reactions` | `{ clientId, emoji }` か `{ clientId, customEmojiId }` でトグル |
| DELETE | `/api/admin/emojis/[id]` | 管理者がカスタム絵文字を削除 |

アップロードされた画像は、サーバーで実際にデコードして形式を確かめ（PNG・JPEG・GIF・WebP のみ、SVG 不可）、`sharp` で 128×128 の WebP に作り直してから Storage に保存する。アニメーションは残す。

## セキュリティ

- 編集用パスワードは bcrypt（cost 10）で保存し、PUT / DELETE のたびに照合する
- 全テーブルで RLS を有効にしてポリシーを作らない。アクセスはサーバーから service role キーでだけ
- URLは `http(s)://` のみ許可。`javascript:` は zod と DB の CHECK 制約で二重に弾く
- 外部リンクは `target="_blank" rel="noopener noreferrer"`
- コメントは React のテキストとして表示し、`dangerouslySetInnerHTML` は使わない
- IPは平文で保存せず `sha256(IP + IP_HASH_SALT)` で持つ
- レート制限：予約 5回/10分、コメント 3回/1分、リアクション 30回/1分、カスタム絵文字の登録 5回/1時間、管理ログイン 5回/10分
- カスタム絵文字：元画像 256KB まで、登録は全体で 300 個まで、1つの記事に付けられる絵文字は 30 種類まで
