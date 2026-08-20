import type { Metadata } from 'next';
import { CheckoutForm } from '@/components/checkout-form';
import { RequireAuth } from '@/components/require-auth';
import { PageNav } from '@/components/ui';

export const metadata: Metadata = { title: 'Оформлення', robots: { index: false } };

export default function CheckoutPage() {
  return (
    <RequireAuth>
      <PageNav current="Оформлення" />
      <CheckoutForm />
    </RequireAuth>
  );
}
