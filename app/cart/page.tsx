import Link from 'next/link';
import type { Metadata } from 'next';
import { BuyersOnly } from '@/components/buyers-only';
import { CartView } from '@/components/cart-view';
import { PageNav } from '@/components/ui';

export const metadata: Metadata = { title: 'Кошик', robots: { index: false } };

export default function CartPage() {
  return (
    <>
      <PageNav current="Кошик" />

      <BuyersOnly>
        <div className="page-head">
          <h1>Кошик</h1>
          <Link href="/" className="btn btn-secondary">
            Додати ще
          </Link>
        </div>

        <CartView />
      </BuyersOnly>
    </>
  );
}
