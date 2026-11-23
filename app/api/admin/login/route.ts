import { cookies } from 'next/headers';
import type { NextRequest } from 'next/server';
import { ADMIN_COOKIE, checkAdminPassword, createSession, sessionCookieOptions } from '@/lib/adminSession';
import { apiError } from '@/lib/errors';
import { hitRateLimit } from '@/lib/rateLimit';
import { getIpHash, parseBody, withErrorHandling } from '@/lib/request';
import { adminLoginSchema } from '@/lib/validation';

export const POST = withErrorHandling(async (req: NextRequest) => {
  if (await hitRateLimit(getIpHash(req), 'admin_login')) throw apiError('RATE_LIMITED');

  const { password } = await parseBody(req, adminLoginSchema);
  if (!checkAdminPassword(password)) throw apiError('WRONG_PASSWORD');

  (await cookies()).set(ADMIN_COOKIE, await createSession(), sessionCookieOptions);
  return new Response(null, { status: 204 });
});
