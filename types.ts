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

/** アップロードされたカスタム絵文字 */
export type CustomEmoji = {
  id: string;
  name: string;
  url: string;
};

/** 1つの絵文字ぶんのリアクション（件数0のものは返さない） */
export type ReactionItem = {
  /** reactions.emoji の値。Unicode 絵文字か "c:<id>" */
  key: string;
  /** Unicode 絵文字のとき */
  emoji: string | null;
  /** カスタム絵文字のとき */
  custom: CustomEmoji | null;
  count: number;
  /** このブラウザ（clientId）が押しているか */
  mine: boolean;
};

export type DayDetail = {
  day: number;
  authorName: string;
  title: string | null;
  url: string | null;
  comments: Comment[];
  reactions: ReactionItem[];
};

export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'WRONG_PASSWORD'
  | 'UNAUTHORIZED'
  | 'ENTRY_CLOSED'
  | 'NOT_FOUND'
  | 'NOT_PUBLISHED'
  | 'SLOT_TAKEN'
  | 'EMOJI_NAME_TAKEN'
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

export type AdminCustomEmoji = CustomEmoji & {
  createdAt: string;
  /** この絵文字で付いているリアクションの数 */
  useCount: number;
};

export type AdminOverview = {
  slots: AdminSlot[];
  comments: AdminComment[];
  customEmojis: AdminCustomEmoji[];
  entryOpen: boolean;
};
