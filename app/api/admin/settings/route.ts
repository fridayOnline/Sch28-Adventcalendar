import { revalidatePath } from 'next/cache';
import type { NextRequest } from 'next/server';
import { setEntryOpen } from '@/lib/queries';
import { requireAdmin } from '@/lib/requireAdmin';
import { parseBody, withErrorHandling } from '@/lib/request';
import { adminSettingsSchema } from '@/lib/validation';

export const PATCH = withErrorHandling(async (req: NextRequest) => {
  await requireAdmin();
  const { entryOpen } = await parseBody(req, adminSettingsSchema);
  await setEntryOpen(entryOpen);
  revalidatePath('/');
  return Response.json({ entryOpen });
});
