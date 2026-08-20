import type { Metadata } from 'next';
import { Bitter, Manrope } from 'next/font/google';
import { Providers } from './providers';
import { BackgroundDecor } from '@/components/background-decor';
import { SiteHeader } from '@/components/site-nav';
import './globals.css';

/**
 * DEVIATION from the handoff: it names Caprasimo + Figtree, and neither ships
 * a Cyrillic subset - every Ukrainian heading would fall back to a system
 * font. Bitter (heavy warm slab) and Manrope (friendly geometric sans) carry
 * the same tone and cover cyrillic.
 */
const display = Bitter({
  subsets: ['cyrillic', 'latin'],
  variable: '--font-display',
  display: 'swap',
});

const text = Manrope({
  subsets: ['cyrillic', 'latin'],
  variable: '--font-text',
  display: 'swap',
});

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
    <html lang="uk" className={`${display.variable} ${text.variable}`}>
      <body>
        <Providers>
          <BackgroundDecor />

          <div className="page-root">
            <SiteHeader />

            <main className="page-main pasika-page">{children}</main>

            <footer className="site-footer">
              Мед з власної пасіки. Доставка Новою поштою.
            </footer>
          </div>
        </Providers>
      </body>
    </html>
  );
}
