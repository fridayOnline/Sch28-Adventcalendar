import 'server-only';
import { db } from '@/lib/supabase';
import { currentTime, isPublished, todayDay } from '@/lib/publish';
import { EMOJIS } from '@/types';
import type {
  AdminComment,
  AdminOverview,
  AdminSlot,
  CalendarCell,
  Comment,
  DayDetail,
  Emoji,
  ReactionCounts,
  SlotState,
} from '@/types';

type SummaryRow = {
  day: number;
  author_name: string;
  title: string | null;
  url: string | null;
  hidden: boolean;
  comment_count: number;
  reaction_count: number;
};

const emptyCounts = (): ReactionCounts =>
  Object.fromEntries(EMOJIS.map((e) => [e, 0])) as ReactionCounts;

/** slot_summaries を読み1〜25日を埋める。公開前は title/url を null、hidden の枠は open 扱い */
export async function getCalendar(now = currentTime()): Promise<CalendarCell[]> {
  const { data, error } = await db()
    .from('slot_summaries')
    .select('day, author_name, title, url, hidden, comment_count, reaction_count');
  if (error) throw error;

  const rows = new Map<number, SummaryRow>();
  for (const r of (data ?? []) as SummaryRow[]) rows.set(r.day, r);

  const today = todayDay(now);
  const cells: CalendarCell[] = [];

  for (let day = 1; day <= 25; day++) {
    const row = rows.get(day);
    const isOpen = !row || row.hidden;
    const published = !isOpen && isPublished(day, now);
    const state: SlotState = isOpen ? 'open' : published ? 'published' : 'reserved';

    cells.push({
      day,
      state,
      authorName: isOpen ? null : row!.author_name,
      // 公開前の title/url はそもそも返さない
      title: published ? row!.title : null,
      url: published ? row!.url : null,
      commentCount: isOpen ? 0 : Number(row!.comment_count),
      reactionCount: isOpen ? 0 : Number(row!.reaction_count),
      isToday: day === today,
    });
  }
  return cells;
}

/** 公開前・未予約・hidden なら null */
export async function getDayDetail(
  day: number,
  clientId?: string,
  now = currentTime(),
): Promise<DayDetail | null> {
  if (!isPublished(day, now)) return null;

  const supabase = db();
  const { data: slot, error } = await supabase
    .from('slots')
    .select('day, author_name, title, url, hidden')
    .eq('day', day)
    .maybeSingle();
  if (error) throw error;
  if (!slot || slot.hidden) return null;

  const [{ data: commentRows }, { data: reactionRows }] = await Promise.all([
    supabase
      .from('comments')
      .select('id, name, body, created_at')
      .eq('day', day)
      .eq('hidden', false)
      .order('created_at', { ascending: false })
      .limit(100),
    supabase.from('reactions').select('emoji, client_id').eq('day', day),
  ]);

  const comments: Comment[] = (commentRows ?? []).map((c) => ({
    id: c.id as string,
    name: c.name as string,
    body: c.body as string,
    createdAt: c.created_at as string,
  }));

  const reactions = emptyCounts();
  const myReactions: Emoji[] = [];
  for (const r of reactionRows ?? []) {
    const emoji = r.emoji as Emoji;
    if (!(emoji in reactions)) continue;
    reactions[emoji] += 1;
    if (clientId && r.client_id === clientId) myReactions.push(emoji);
  }

  return {
    day: slot.day as number,
    authorName: slot.author_name as string,
    title: slot.title as string | null,
    url: slot.url as string | null,
    comments,
    reactions,
    myReactions,
  };
}

/** その日の絵文字ごとの件数と、clientId が押したもの */
export async function getReactionState(
  day: number,
  clientId: string,
): Promise<{ reactions: ReactionCounts; myReactions: Emoji[] }> {
  const { data, error } = await db()
    .from('reactions')
    .select('emoji, client_id')
    .eq('day', day);
  if (error) throw error;

  const reactions = emptyCounts();
  const myReactions: Emoji[] = [];
  for (const r of data ?? []) {
    const emoji = r.emoji as Emoji;
    if (!(emoji in reactions)) continue;
    reactions[emoji] += 1;
    if (r.client_id === clientId) myReactions.push(emoji);
  }
  return { reactions, myReactions };
}

export async function isEntryOpen(): Promise<boolean> {
  const { data, error } = await db()
    .from('settings')
    .select('value')
    .eq('key', 'entry_open')
    .maybeSingle();
  if (error) throw error;
  return data?.value === true || data?.value === 'true';
}

export async function setEntryOpen(open: boolean): Promise<void> {
  const { error } = await db()
    .from('settings')
    .upsert({ key: 'entry_open', value: open }, { onConflict: 'key' });
  if (error) throw error;
}

/** 全枠（公開前も含む）、全コメント（hidden も含む、新しい順）、entry_open */
export async function getAdminOverview(now = currentTime()): Promise<AdminOverview> {
  const supabase = db();
  const [{ data: summaries, error: e1 }, { data: commentRows, error: e2 }, entryOpen] =
    await Promise.all([
      supabase
        .from('slot_summaries')
        .select('day, author_name, title, url, hidden, comment_count, reaction_count')
        .order('day'),
      supabase
        .from('comments')
        .select('id, day, name, body, hidden, created_at')
        .order('created_at', { ascending: false })
        .limit(500),
      isEntryOpen(),
    ]);
  if (e1) throw e1;
  if (e2) throw e2;

  const byDay = new Map<number, SummaryRow>();
  for (const r of (summaries ?? []) as SummaryRow[]) byDay.set(r.day, r);

  const slots: AdminSlot[] = [];
  for (let day = 1; day <= 25; day++) {
    const row = byDay.get(day);
    if (!row) {
      slots.push({
        day,
        authorName: '',
        title: null,
        url: null,
        hidden: false,
        state: 'open',
        commentCount: 0,
        reactionCount: 0,
      });
      continue;
    }
    slots.push({
      day,
      authorName: row.author_name,
      title: row.title,
      url: row.url,
      hidden: row.hidden,
      state: isPublished(day, now) ? 'published' : 'reserved',
      commentCount: Number(row.comment_count),
      reactionCount: Number(row.reaction_count),
    });
  }

  const comments: AdminComment[] = (commentRows ?? []).map((c) => ({
    id: c.id as string,
    day: c.day as number,
    name: c.name as string,
    body: c.body as string,
    hidden: c.hidden as boolean,
    createdAt: c.created_at as string,
  }));

  return { slots, comments, entryOpen };
}
