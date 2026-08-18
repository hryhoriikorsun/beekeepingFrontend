'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { formatDate, formatMoney } from '@/lib/format';
import type { Order } from '@/lib/api/types';

export const ORDER_STATUS: Record<Order['status'], { label: string; className: string }> = {
  CREATED: { label: 'Прийнято', className: 'bg-stone-100 text-stone-700' },
  PENDING_PAYMENT: { label: 'Очікує оплати', className: 'bg-amber-100 text-amber-800' },
  PAID: { label: 'Оплачено', className: 'bg-green-100 text-green-800' },
  SHIPPED: { label: 'Відправлено', className: 'bg-blue-100 text-blue-800' },
  DONE: { label: 'Виконано', className: 'bg-green-100 text-green-800' },
  CANCELLED: { label: 'Скасовано', className: 'bg-red-100 text-red-800' },
};

export function OrderStatusBadge({ status }: { status: Order['status'] }) {
  const { label, className } = ORDER_STATUS[status];
  return <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${className}`}>{label}</span>;
}

export function OrdersList() {
  const { data: orders, isPending, error } = useQuery({
    queryKey: ['orders'],
    queryFn: async (): Promise<Order[]> => {
      const { data, error: apiError } = await api.GET('/orders');
      if (apiError || !data) {
        throw new Error('Не вдалося завантажити замовлення');
      }
      return data;
    },
  });

  if (isPending) {
    return <p className="text-stone-500">Завантаження…</p>;
  }
  if (error) {
    return <p className="rounded bg-red-50 p-3 text-red-700">{error.message}</p>;
  }
  if (orders.length === 0) {
    return (
      <p className="text-stone-600">
        Замовлень поки немає.{' '}
        <Link href="/" className="text-amber-700 underline">
          До каталогу
        </Link>
      </p>
    );
  }

  return (
    <ul className="divide-y divide-amber-200 rounded-xl border border-amber-200 bg-white">
      {orders.map((order) => (
        <li key={order.id}>
          <Link
            href={`/orders/${order.id}`}
            className="flex flex-wrap items-center justify-between gap-3 p-4 hover:bg-amber-50"
          >
            <div>
              <p className="font-medium">Замовлення №{order.number}</p>
              <p className="text-sm text-stone-500">{formatDate(order.createdAt)}</p>
            </div>
            <div className="flex items-center gap-4">
              <OrderStatusBadge status={order.status} />
              <span className="font-semibold">{formatMoney(order.total)}</span>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
