'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { logout } from '@/lib/auth/actions';
import { useAuthStore } from '@/lib/auth/store';
import { useCartStore } from '@/lib/cart/store';
import { BasketIcon, CloseIcon, HiveIcon, LockIcon, MenuIcon, ShieldIcon } from './icons';

const ROLE_LABEL: Record<string, string> = {
  ADMIN: 'адміністратор',
  CUSTOMER: 'користувач',
  DEALER: 'курєр',
};

const ADMIN_HINT = 'Ця сторінка для покупців. Адміністратор не купує товар.';

/// A menu row that goes nowhere: it names the destination, shows why it is
/// shut, and stays reachable by keyboard so the reason is not hover-only.
function LockedRow({ label, hint }: { label: string; hint: string }) {
  return (
    <span className="drawer-link locked-link has-tooltip" tabIndex={0} aria-disabled="true">
      {label}
      <LockIcon />
      <span role="tooltip" className="tooltip">
        {hint}
      </span>
    </span>
  );
}

/**
 * Three things only: brand on the left, one destination and the burger on the
 * right. For a buyer that destination is the cart; for an admin, who cannot
 * buy anything, it is the admin section instead.
 */
export function SiteHeader() {
  const { user } = useAuthStore();
  const count = useCartStore((s) => s.lines.reduce((sum, l) => sum + l.qty, 0));
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  const close = () => setMenuOpen(false);
  const isAdmin = user?.role === 'ADMIN';
  const roleSuffix =
    user && user.role !== 'CUSTOMER' ? ` · ${ROLE_LABEL[user.role] ?? user.role}` : '';

  return (
    <header className="site-header">
      <div className="nav">
        <Link href="/" className="nav-brand">
          <span className="brand-badge">
            <HiveIcon />
          </span>
          Пасіка
        </Link>

        {isAdmin ? (
          <Link href="/admin" className="cart-link admin-link" aria-label="Адмінка">
            <ShieldIcon size={20} />
            <span className="cart-label">Адмінка</span>
          </Link>
        ) : (
          <Link href="/cart" className="cart-link" aria-label="Кошик">
            <BasketIcon size={20} />
            <span className="cart-label">Кошик</span>
            {count > 0 && (
              <span key={count} className="tag tag-accent badge-pop cart-count">
                {count}
              </span>
            )}
          </Link>
        )}

        <button
          type="button"
          className="burger-btn"
          aria-label="Меню"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((v) => !v)}
        >
          <MenuIcon />
        </button>
      </div>

      {menuOpen && (
        <>
          <div className="drawer-backdrop" onClick={close} />
          <nav className="drawer-panel" aria-label="Основне меню">
            <div className="flex items-center justify-between">
              <span className="nav-brand">Меню</span>
              <button type="button" className="burger-btn" aria-label="Закрити" onClick={close}>
                <CloseIcon />
              </button>
            </div>

            <Link href="/" className="drawer-link" onClick={close}>
              Каталог
            </Link>

            {user ? (
              <>
                {isAdmin ? (
                  <>
                    <Link href="/admin" className="drawer-link" onClick={close}>
                      Адмінка
                    </Link>
                    <LockedRow label="Замовлення" hint={ADMIN_HINT} />
                    <LockedRow label="Кошик" hint={ADMIN_HINT} />
                  </>
                ) : (
                  <Link href="/orders" className="drawer-link" onClick={close}>
                    Замовлення
                  </Link>
                )}
                <div className="nav-user px-1 py-2">
                  {user.email}
                  {roleSuffix}
                </div>
                <button
                  type="button"
                  className="btn btn-ghost btn-block"
                  onClick={() => {
                    close();
                    void logout();
                  }}
                >
                  Вийти
                </button>
              </>
            ) : (
              <Link href="/login" className="btn btn-primary btn-block" onClick={close}>
                Увійти
              </Link>
            )}
          </nav>
        </>
      )}
    </header>
  );
}
