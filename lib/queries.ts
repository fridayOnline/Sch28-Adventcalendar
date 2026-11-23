import 'server-only';
import { db } from '@/lib/supabase';
import { currentTime, isPublished, todayDay } from '@/lib/publish';
import { isCustomKey } from '@/lib/emoji';
import type {
  AdminComment,
  AdminCustomEmoji,
  AdminOverview,
  AdminSlot,
  CalendarCell,
  Comment,
  CustomEmoji,
  DayDetail,
  ReactionItem,
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

/** Storage の emojis バケットにある画像の公開URL */
export const emojiUrl = (path: string) => db().storage.from('emojis').getPublicUrl(path).data.publicUrl;

type CustomEmojiRow = { id: string; name: string; path: string; created_at: string };
const toCustomEmoji = (r: CustomEmojiRow): CustomEmoji => ({ id: r.id, name: r.name, url: emojiUrl(r.path) });

/** ピッカーに出すカスタム絵文字（古い順） */
export async function listCustomEmojis(): Promise<CustomEmoji[]> {
  const { data, error } = await db()
    .from('custom_emojis')
    .select('id, name, path, created_at')
    .order('created_at', { ascending: true })
    .limit(500);
  if (error) throw error;
  return ((data ?? []) as CustomEmojiRow[]).map(toCustomEmoji);
}

/**
 * その日のリアクションを絵文字ごとにまとめる。最初に押された順に並べる（Slack と同じ）。
 * clientId を渡すと、そのブラウザが押しているかどうか（mine）も付ける。
 */
export async function getReactionItems(day: number, clientId?: string): Promise<ReactionItem[]> {
  const supabase = db();
  const { data, error } = await supabase
    .from('reactions')
    .select('emoji, client_id, custom_emoji_id, created_at')
    .eq('day', day);
  if (error) throw error;

  type Group = { key: string; count: number; mine: boolean; first: string; customId: string | null };
  const groups = new Map<string, Group>();
  for (const r of data ?? []) {
    const key = r.emoji as string;
    const g = groups.get(key) ?? { key, count: 0, mine: false, first: r.created_at as string, customId: (r.custom_emoji_id as string) ?? null };
    g.count += 1;
    if (clientId && r.client_id === clientId) g.mine = true;
    if ((r.created_at as string) < g.first) g.first = r.created_at as string;
    groups.set(key, g);
  }

  const customIds = [...groups.values()].map((g) => g.customId).filter((id): id is string => !!id);
  const customs = new Map<string, CustomEmoji>();
  if (customIds.length > 0) {
    const { data: rows, error: e2 } = await supabase
      .from('custom_emojis')
      .select('id, name, path, created_at')
      .in('id', customIds);
    if (e2) throw e2;
    for (const row of (rows ?? []) as CustomEmojiRow[]) customs.set(row.id, toCustomEmoji(row));
  }

  return [...groups.values()]
    .sort((a, b) => (a.first < b.first ? -1 : a.first > b.first ? 1 : 0))
    .flatMap((g): ReactionItem[] => {
      if (isCustomKey(g.key)) {
        const custom = g.customId ? customs.get(g.customId) : undefined;
        return custom ? [{ key: g.key, emoji: null, custom, count: g.count, mine: g.mine }] : [];
      }
      return [{ key: g.key, emoji: g.key, custom: null, count: g.count, mine: g.mine }];
    });
}

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

  const [{ data: commentRows }, reactions] = await Promise.all([
    supabase
      .from('comments')
      .select('id, name, body, created_at')
      .eq('day', day)
      .eq('hidden', false)
      .order('created_at', { ascending: false })
      .limit(100),
    getReactionItems(day, clientId),
  ]);

  const comments: Comment[] = (commentRows ?? []).map((c) => ({
    id: c.id as string,
    name: c.name as string,
    body: c.body as string,
    createdAt: c.created_at as string,
  }));

  return {
    day: slot.day as number,
    authorName: slot.author_name as string,
    title: slot.title as string | null,
    url: slot.url as string | null,
    comments,
    reactions,
  };
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
  const [
    { data: summaries, error: e1 },
    { data: commentRows, error: e2 },
    entryOpen,
    { data: emojiRows, error: e3 },
    { data: customReactionRows, error: e4 },
  ] = await Promise.all([
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
      supabase
        .from('custom_emojis')
        .select('id, name, path, created_at')
        .order('created_at', { ascending: false })
        .limit(500),
      supabase.from('reactions').select('custom_emoji_id'),
    ]);
  if (e1) throw e1;
  if (e2) throw e2;
  if (e3) throw e3;
  if (e4) throw e4;

  const useCount = new Map<string, number>();
  for (const r of customReactionRows ?? []) {
    const id = r.custom_emoji_id as string | null;
    if (id) useCount.set(id, (useCount.get(id) ?? 0) + 1);
  }
  const customEmojis: AdminCustomEmoji[] = ((emojiRows ?? []) as CustomEmojiRow[]).map((r) => ({
    ...toCustomEmoji(r),
    createdAt: r.created_at,
    useCount: useCount.get(r.id) ?? 0,
  }));

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

  return { slots, comments, customEmojis, entryOpen };
}
