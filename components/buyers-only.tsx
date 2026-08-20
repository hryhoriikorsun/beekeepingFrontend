'use client';

import Link from 'next/link';
import { useAuthStore } from '@/lib/auth/store';
import { LockIcon } from './icons';

/**
 * Screens that only make sense for someone who buys. The API already refuses
 * an admin's order with «Адміністратор не купує товар»; this keeps the admin
 * from walking into that wall, and from reading the whole shop's orders under
 * a heading that says "мої".
 */
export function BuyersOnly({ children }: { children: React.ReactNode }) {
  const isAdmin = useAuthStore((s) => s.user?.role === 'ADMIN');

  if (!isAdmin) {
    return <>{children}</>;
  }

  return (
    <div className="card elev-sm py-8 text-center">
      <p className="mb-3 flex items-center justify-center gap-2 text-neutral-700">
        <LockIcon size={16} />
        Ця сторінка для покупців. Адміністратор не купує товар.
      </p>
      <Link href="/admin" className="btn btn-secondary">
        До адмінки
      </Link>
    </div>
  );
}
