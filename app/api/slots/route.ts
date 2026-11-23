import { getCalendar } from '@/lib/queries';
import { withErrorHandling } from '@/lib/request';

export const dynamic = 'force-dynamic';

export const GET = withErrorHandling(async () => {
  const cells = await getCalendar();
  return Response.json(cells);
});
