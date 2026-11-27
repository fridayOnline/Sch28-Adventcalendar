import type { NextRequest } from 'next/server';
import { getCalendar } from '@/lib/queries';
import { parseCal, withErrorHandling } from '@/lib/request';

export const dynamic = 'force-dynamic';

export const GET = withErrorHandling(async (req: NextRequest) => {
  const cells = await getCalendar(parseCal(req));
  return Response.json(cells);
});
