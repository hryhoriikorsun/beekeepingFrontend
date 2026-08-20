import type { Metadata } from 'next';
import { BuyersOnly } from '@/components/buyers-only';
import { OrdersList } from '@/components/orders-list';
import { RequireAuth } from '@/components/require-auth';
import { PageNav } from '@/components/ui';

export const metadata: Metadata = { title: 'Мої замовлення', robots: { index: false } };

export default function OrdersPage() {
  return (
    <RequireAuth>
      <PageNav current="Замовлення" />
      {/* The heading is inside the gate: "мої замовлення" is a lie to an
          admin, who has none and would be shown the whole shop's instead. */}
      <BuyersOnly>
        <h1 className="mb-6">Мої замовлення</h1>
        <OrdersList />
      </BuyersOnly>
    </RequireAuth>
  );
}
