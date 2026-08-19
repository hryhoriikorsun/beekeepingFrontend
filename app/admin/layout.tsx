import type { Metadata } from 'next';
import { AdminNav } from '@/components/admin/admin-nav';
import { RequireAdmin } from '@/components/require-admin';

export const metadata: Metadata = { title: 'Адмінка', robots: { index: false } };

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireAdmin>
      <AdminNav />
      {children}
    </RequireAdmin>
  );
}
