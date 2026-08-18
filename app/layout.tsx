import type { Metadata } from 'next';
import Link from 'next/link';
import { Providers } from './providers';
import { SiteNav } from '@/components/site-nav';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Мед з власної пасіки',
    template: '%s — Мед з власної пасіки',
  },
  description:
    'Мед, стільники та продукти бджільництва з власної пасіки. Доставка Новою поштою по Україні.',
  openGraph: { type: 'website', locale: 'uk_UA' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uk">
      <body className="min-h-screen bg-amber-50 text-stone-900 antialiased">
        <Providers>
          <header className="border-b border-amber-200 bg-white/80 backdrop-blur">
            <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4">
              <Link href="/" className="text-lg font-semibold tracking-tight">
                🍯 Пасіка
              </Link>
              <SiteNav />
            </div>
          </header>

          <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>

          <footer className="mx-auto max-w-5xl px-4 py-10 text-sm text-stone-500">
            Мед з власної пасіки. Доставка Новою поштою.
          </footer>
        </Providers>
      </body>
    </html>
  );
}
