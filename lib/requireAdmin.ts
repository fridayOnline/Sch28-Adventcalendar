import 'server-only';
import { isAdmin } from '@/lib/adminSession';
import { apiError } from '@/lib/errors';

export async function requireAdmin(): Promise<void> {
  if (!(await isAdmin())) throw apiError('UNAUTHORIZED');
}
