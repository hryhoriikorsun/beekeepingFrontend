import type { Metadata } from 'next';
import { BuyersOnly } from '@/components/buyers-only';
import { OrderDetail } from '@/components/order-detail';
import { RequireAuth } from '@/components/require-auth';
import { PageNav } from '@/components/ui';

export const metadata: Metadata = { title: 'Замовлення', robots: { index: false } };

export default async function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <RequireAuth>
      <PageNav current="Замовлення" />
      <BuyersOnly>
        <OrderDetail id={id} />
      </BuyersOnly>
    </RequireAuth>
  );
}
