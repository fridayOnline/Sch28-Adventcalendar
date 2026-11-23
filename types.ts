export const EMOJIS = ['👍', '🎉', '😂', '🔥', '❤️'] as const;
export type Emoji = (typeof EMOJIS)[number];

export const EMOJI_LABELS: Record<Emoji, string> = {
  '👍': 'いいね',
  '🎉': 'おめでとう',
  '😂': 'わらった',
  '🔥': 'アツい',
  '❤️': 'すき',
};

export type SlotState = 'open' | 'reserved' | 'published';

/** カレンダーの1マス（公開前は title/url が必ず null） */
export type CalendarCell = {
  day: number;
  state: SlotState;
  authorName: string | null;
  title: string | null;
  url: string | null;
  commentCount: number;
  reactionCount: number;
  isToday: boolean;
};

export type Comment = {
  id: string;
  name: string;
  body: string;
  createdAt: string;
};

export type ReactionCounts = Record<Emoji, number>;

export type DayDetail = {
  day: number;
  authorName: string;
  title: string | null;
  url: string | null;
  comments: Comment[];
  reactions: ReactionCounts;
  myReactions: Emoji[];
};

export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'WRONG_PASSWORD'
  | 'UNAUTHORIZED'
  | 'ENTRY_CLOSED'
  | 'NOT_FOUND'
  | 'NOT_PUBLISHED'
  | 'SLOT_TAKEN'
  | 'ALREADY_PUBLISHED'
  | 'RATE_LIMITED'
  | 'INTERNAL_ERROR';

export type ApiError = { error: { code: ErrorCode; message: string } };

/** 管理画面用（公開前の内容も含む） */
export type AdminSlot = {
  day: number;
  authorName: string;
  title: string | null;
  url: string | null;
  hidden: boolean;
  state: SlotState;
  commentCount: number;
  reactionCount: number;
};

export type AdminComment = {
  id: string;
  day: number;
  name: string;
  body: string;
  hidden: boolean;
  createdAt: string;
};

export type AdminOverview = {
  slots: AdminSlot[];
  comments: AdminComment[];
  entryOpen: boolean;
};
