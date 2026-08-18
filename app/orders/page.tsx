import type { Metadata } from 'next';
import { OrdersList } from '@/components/orders-list';
import { RequireAuth } from '@/components/require-auth';

export const metadata: Metadata = { title: 'Мої замовлення', robots: { index: false } };

export default function OrdersPage() {
  return (
    <RequireAuth>
      <h1 className="mb-6 text-2xl font-semibold">Мої замовлення</h1>
      <OrdersList />
    </RequireAuth>
  );
}
