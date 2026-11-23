import type { ErrorCode } from '@/types';

export const ERROR_MESSAGES: Record<ErrorCode, string> = {
  VALIDATION_ERROR: '入力内容を確認してください',
  WRONG_PASSWORD: 'パスワードが違います',
  UNAUTHORIZED: '管理者としてログインしてください',
  ENTRY_CLOSED: '現在、予約を受け付けていません',
  NOT_FOUND: 'ページが見つかりません',
  NOT_PUBLISHED: 'この日の記事はまだ公開されていません',
  SLOT_TAKEN: 'この日はもう埋まっています',
  ALREADY_PUBLISHED: '公開後は取り消せません。管理者に連絡してください',
  RATE_LIMITED: '少し時間を置いてからもう一度お試しください',
  INTERNAL_ERROR: 'エラーが起きました。時間を置いてもう一度お試しください',
};

const STATUS: Record<ErrorCode, number> = {
  VALIDATION_ERROR: 400,
  WRONG_PASSWORD: 401,
  UNAUTHORIZED: 401,
  ENTRY_CLOSED: 403,
  NOT_FOUND: 404,
  NOT_PUBLISHED: 404,
  SLOT_TAKEN: 409,
  ALREADY_PUBLISHED: 409,
  RATE_LIMITED: 429,
  INTERNAL_ERROR: 500,
};

/** Route Handler から throw して withErrorHandling に拾わせる */
export class ApiException extends Error {
  code: ErrorCode;
  status: number;

  constructor(code: ErrorCode, message?: string) {
    super(message ?? ERROR_MESSAGES[code]);
    this.code = code;
    this.status = STATUS[code];
  }
}

export const apiError = (code: ErrorCode, message?: string) =>
  new ApiException(code, message);
