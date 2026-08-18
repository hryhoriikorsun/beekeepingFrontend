'use client';

import Link from 'next/link';
import { logout } from '@/lib/auth/actions';
import { useAuthStore } from '@/lib/auth/store';
import { useCartStore } from '@/lib/cart/store';

const ROLE_LABEL: Record<string, string> = {
  ADMIN: 'адміністратор',
  CUSTOMER: 'покупець',
  DEALER: 'гуртовий покупець',
};

export function SiteNav() {
  const { user, status } = useAuthStore();
  const count = useCartStore((s) => s.lines.reduce((sum, l) => sum + l.qty, 0));

  return (
    <nav className="flex items-center gap-4 text-sm">
      <Link href="/cart" className="relative rounded px-2 py-1 hover:bg-amber-100">
        Кошик
        {count > 0 && (
          <span className="ml-1 rounded-full bg-amber-500 px-1.5 py-0.5 text-xs text-white">
            {count}
          </span>
        )}
      </Link>

      {/* Until the silent refresh answers we show nothing rather than
          guessing wrong and flashing the opposite state. */}
      {status === 'unknown' ? (
        <span className="h-6 w-20 animate-pulse rounded bg-amber-100" />
      ) : user ? (
        <>
          <Link href="/orders" className="rounded px-2 py-1 hover:bg-amber-100">
            Замовлення
          </Link>
          <span className="text-stone-500">
            {user.email}
            {user.role !== 'CUSTOMER' && ` · ${ROLE_LABEL[user.role] ?? user.role}`}
          </span>
          <button
            type="button"
            onClick={() => void logout()}
            className="rounded px-2 py-1 text-stone-500 hover:bg-amber-100"
          >
            Вийти
          </button>
        </>
      ) : (
        <Link
          href="/login"
          className="rounded bg-amber-500 px-3 py-1.5 font-medium text-white hover:bg-amber-600"
        >
          Увійти
        </Link>
      )}
    </nav>
  );
}
