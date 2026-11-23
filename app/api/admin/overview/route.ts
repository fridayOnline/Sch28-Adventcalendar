import { getAdminOverview } from '@/lib/queries';
import { requireAdmin } from '@/lib/requireAdmin';
import { withErrorHandling } from '@/lib/request';

export const dynamic = 'force-dynamic';

export const GET = withErrorHandling(async () => {
  await requireAdmin();
  return Response.json(await getAdminOverview());
});
