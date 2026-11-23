import type { Metadata } from 'next';
import AdminPanel from '@/components/AdminPanel';

export const metadata: Metadata = { robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

export default function AdminPage() {
  return <AdminPanel />;
}
