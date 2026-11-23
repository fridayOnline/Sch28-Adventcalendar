-- slots: 1日1枠。day が PK なので二重予約はDBが弾く
create table slots (
  day            smallint primary key check (day between 1 and 25),
  author_name    text not null check (char_length(author_name) between 1 and 30),
  title          text check (title is null or char_length(title) <= 100),
  url            text check (url is null or url ~ '^https?://'),
  edit_key_hash  text not null,
  hidden         boolean not null default false,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create table comments (
  id          uuid primary key default gen_random_uuid(),
  day         smallint not null references slots(day) on delete cascade,
  name        text not null default '名無し' check (char_length(name) between 1 and 30),
  body        text not null check (char_length(body) between 1 and 280),
  hidden      boolean not null default false,
  ip_hash     text not null,
  created_at  timestamptz not null default now()
);
create index comments_day_created_idx on comments (day, created_at desc);

create table reactions (
  day         smallint not null references slots(day) on delete cascade,
  emoji       text not null check (emoji in ('👍','🎉','😂','🔥','❤️')),
  client_id   uuid not null,
  created_at  timestamptz not null default now(),
  primary key (day, emoji, client_id)
);

create table settings (
  key    text primary key,
  value  jsonb not null
);
insert into settings (key, value) values ('entry_open', 'true');

create table rate_limits (
  id          bigserial primary key,
  ip_hash     text not null,
  action      text not null,
  created_at  timestamptz not null default now()
);
create index rate_limits_lookup_idx on rate_limits (ip_hash, action, created_at);

-- updated_at を自動更新
create function touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;
create trigger slots_touch before update on slots
  for each row execute function touch_updated_at();

-- カレンダー用の集計ビュー（非表示コメントは数えない）
create view slot_summaries as
select s.day, s.author_name, s.title, s.url, s.hidden,
  (select count(*) from comments c where c.day = s.day and not c.hidden) as comment_count,
  (select count(*) from reactions r where r.day = s.day) as reaction_count
from slots s;

-- RLS: 有効化してポリシーは作らない（service role 以外は読み書き不可）
alter table slots       enable row level security;
alter table comments    enable row level security;
alter table reactions   enable row level security;
alter table settings    enable row level security;
alter table rate_limits enable row level security;
revoke all on slot_summaries from anon, authenticated;
