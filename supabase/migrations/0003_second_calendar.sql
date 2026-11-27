-- 2枚目のカレンダー（Qiita の「シリーズ2」と同じ考え方）
-- 0002_custom_emojis.sql の後に SQL Editor で実行する。
-- 既存の行は calendar = 1（1枚目）になるので、今のデータはそのまま残る。
-- 何枚まで使うかはアプリ側の lib/calendars.ts の CALENDAR_COUNT で決める（DB は 1〜9 を許す）

begin;

-- slots を参照している外部キーをいったん外す（slots の主キーを作り直すため）
alter table comments  drop constraint comments_day_fkey;
alter table reactions drop constraint reactions_day_fkey;

-- slots：1日1枠 → 1カレンダー・1日1枠。主キー (calendar, day) で二重予約を弾く
alter table slots
  add column calendar smallint not null default 1 check (calendar between 1 and 9);
alter table slots drop constraint slots_pkey;
alter table slots add primary key (calendar, day);

-- comments
alter table comments add column calendar smallint not null default 1;
alter table comments
  add constraint comments_slot_fkey foreign key (calendar, day)
  references slots (calendar, day) on delete cascade;
drop index comments_day_created_idx;
create index comments_cal_day_created_idx on comments (calendar, day, created_at desc);

-- reactions
alter table reactions add column calendar smallint not null default 1;
alter table reactions drop constraint reactions_pkey;
alter table reactions add primary key (calendar, day, emoji, client_id);
alter table reactions
  add constraint reactions_slot_fkey foreign key (calendar, day)
  references slots (calendar, day) on delete cascade;

-- カレンダー用の集計ビューを calendar 込みで作り直す
drop view slot_summaries;
create view slot_summaries as
select s.calendar, s.day, s.author_name, s.title, s.url, s.hidden,
  (select count(*) from comments c
     where c.calendar = s.calendar and c.day = s.day and not c.hidden) as comment_count,
  (select count(*) from reactions r
     where r.calendar = s.calendar and r.day = s.day) as reaction_count
from slots s;
revoke all on slot_summaries from anon, authenticated;

commit;
