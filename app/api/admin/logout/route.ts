import { cookies } from 'next/headers';
import { ADMIN_COOKIE } from '@/lib/adminSession';
import { withErrorHandling } from '@/lib/request';

export const POST = withErrorHandling(async () => {
  (await cookies()).delete(ADMIN_COOKIE);
  return new Response(null, { status: 204 });
});
