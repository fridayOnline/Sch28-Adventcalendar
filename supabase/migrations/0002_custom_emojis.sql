-- Slack のようなリアクション：任意の絵文字＋アップロードしたカスタム絵文字
-- 0001_init.sql の後に SQL Editor で実行する

-- カスタム絵文字（画像は Storage の emojis バケットに 128x128 の WebP で置く）
create table custom_emojis (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique check (name ~ '^[a-z0-9_-]{1,32}$'),
  path        text not null,                -- emojis バケット内のパス（例: <id>.webp）
  ip_hash     text not null,                -- 荒らし対応用
  created_at  timestamptz not null default now()
);
alter table custom_emojis enable row level security;
revoke all on custom_emojis from anon, authenticated;

-- reactions：5種類だけの制約を外し、Unicode 絵文字かカスタム絵文字を受け付ける。
-- emoji 列は「Unicode 絵文字そのもの」か「c:<custom_emojis.id>」。主キー (day, emoji, client_id) はそのまま
alter table reactions drop constraint reactions_emoji_check;
alter table reactions
  add column custom_emoji_id uuid references custom_emojis(id) on delete cascade;
alter table reactions
  add constraint reactions_emoji_shape check (
    char_length(emoji) between 1 and 40
    and (
      (custom_emoji_id is null and emoji not like 'c:%')
      or (custom_emoji_id is not null and emoji = 'c:' || custom_emoji_id::text)
    )
  );
create index reactions_custom_emoji_idx on reactions (custom_emoji_id);

-- 画像置き場（公開読み取り。書き込みはサーバーの service role からだけ）
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('emojis', 'emojis', true, 262144, array['image/webp'])
on conflict (id) do nothing;
