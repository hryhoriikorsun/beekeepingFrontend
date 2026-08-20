import type { Metadata } from 'next';
import { OrdersList } from '@/components/orders-list';
import { RequireAuth } from '@/components/require-auth';
import { PageNav } from '@/components/ui';

export const metadata: Metadata = { title: 'Мої замовлення', robots: { index: false } };

export default function OrdersPage() {
  return (
    <RequireAuth>
      <PageNav current="Замовлення" />
      <h1 className="mb-6">Мої замовлення</h1>
      <OrdersList />
    </RequireAuth>
  );
}
