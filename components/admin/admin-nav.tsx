'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const TABS = [
  { href: '/admin', label: 'Статистика' },
  { href: '/admin/products', label: 'Товари' },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="mb-6 flex gap-2 border-b border-amber-200">
      {TABS.map((tab) => {
        const active = tab.href === '/admin' ? pathname === '/admin' : pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`-mb-px border-b-2 px-3 py-2 text-sm ${
              active
                ? 'border-amber-500 font-medium text-amber-800'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
