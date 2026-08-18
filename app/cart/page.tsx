import type { Metadata } from 'next';
import { CartView } from '@/components/cart-view';

export const metadata: Metadata = { title: 'Кошик', robots: { index: false } };

export default function CartPage() {
  return (
    <>
      <h1 className="mb-6 text-2xl font-semibold">Кошик</h1>
      <CartView />
    </>
  );
}
