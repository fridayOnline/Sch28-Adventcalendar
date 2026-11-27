import 'server-only';
import { createHash } from 'node:crypto';
import type { NextRequest } from 'next/server';
import type { z } from 'zod';
import { parseCalParam } from '@/lib/calendars';
import { ApiException, ERROR_MESSAGES } from '@/lib/errors';
import type { ErrorCode } from '@/types';

export function getIpHash(req: NextRequest | Request): string {
  const h = req.headers;
  const ip =
    h.get('x-forwarded-for')?.split(',')[0]?.trim() || h.get('x-real-ip') || 'unknown';
  const salt = process.env.IP_HASH_SALT ?? '';
  return createHash('sha256').update(`${ip}${salt}`).digest('hex');
}

export function jsonError(status: number, code: ErrorCode, message?: string) {
  return Response.json(
    { error: { code, message: message ?? ERROR_MESSAGES[code] } },
    { status },
  );
}

/** JSONを読んで zod で検証。失敗したら 400 VALIDATION_ERROR を throw */
export async function parseBody<T extends z.ZodTypeAny>(
  req: NextRequest | Request,
  schema: T,
): Promise<z.infer<T>> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    throw new ApiException('VALIDATION_ERROR', `${ERROR_MESSAGES.VALIDATION_ERROR}（JSONが読めません）`);
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    const where = first?.path.join('.');
    const detail = [where, first?.message].filter(Boolean).join(': ');
    throw new ApiException(
      'VALIDATION_ERROR',
      `${ERROR_MESSAGES.VALIDATION_ERROR}（${detail}）`,
    );
  }
  return parsed.data;
}

/** [day] の検証。失敗したら 404 NOT_FOUND */
export function parseDay(value: string | undefined): number {
  const n = Number(value);
  if (!Number.isInteger(n) || n < 1 || n > 25) {
    throw new ApiException('NOT_FOUND');
  }
  return n;
}

/** ?cal= の検証（無ければ 1枚目）。範囲外なら 404 NOT_FOUND */
export function parseCal(req: NextRequest): number {
  const cal = parseCalParam(req.nextUrl.searchParams.get('cal'));
  if (cal === null) throw new ApiException('NOT_FOUND');
  return cal;
}

/** 予期しない例外を 500 に変える */
export function withErrorHandling<A extends unknown[]>(
  handler: (...args: A) => Promise<Response>,
) {
  return async (...args: A): Promise<Response> => {
    try {
      return await handler(...args);
    } catch (e) {
      if (e instanceof ApiException) {
        return jsonError(e.status, e.code, e.message);
      }
      console.error('[api]', e);
      return jsonError(500, 'INTERNAL_ERROR');
    }
  };
}
