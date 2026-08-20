'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { formatDate, formatMoney } from '@/lib/format';
import { BasketIcon } from './icons';
import type { Order } from '@/lib/api/types';

/// Status colours come from the palette, never from raw greens and reds:
/// paid and done are sage, awaiting payment is terracotta, cancelled is the
/// single off-palette colour the design allows.
export const ORDER_STATUS: Record<Order['status'], { label: string; className: string }> = {
  CREATED: { label: 'Прийнято', className: 'status-neutral' },
  PENDING_PAYMENT: { label: 'Очікує оплати', className: 'status-pending' },
  PAID: { label: 'Оплачено', className: 'status-paid' },
  SHIPPED: { label: 'Відправлено', className: 'status-shipped' },
  DONE: { label: 'Виконано', className: 'status-paid' },
  CANCELLED: { label: 'Скасовано', className: 'status-cancelled' },
};

export function OrderStatusBadge({ status }: { status: Order['status'] }) {
  const { label, className } = ORDER_STATUS[status];
  return <span className={`status-pill ${className}`}>{label}</span>;
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
    return <p className="text-neutral-600">Завантаження…</p>;
  }
  if (error) {
    return <p className="alert alert-danger">{error.message}</p>;
  }
  if (orders.length === 0) {
    return (
      <div className="card elev-sm py-8 text-center">
        <p className="mb-3 text-neutral-700">Замовлень поки немає.</p>
        <Link href="/" className="btn btn-secondary">
          До каталогу
        </Link>
      </div>
    );
  }

  return (
    <ul className="card elev-sm">
      {orders.map((order) => (
        <li key={order.id} className="cart-row">
          <span className="order-icon">
            <BasketIcon />
          </span>

          <div>
            <Link href={`/orders/${order.id}`} className="font-semibold text-text">
              Замовлення №{order.number}
            </Link>
            <p className="text-[13px] text-neutral-600">{formatDate(order.createdAt)}</p>
          </div>

          <div className="flex-1" />

          <OrderStatusBadge status={order.status} />
          <span className="min-w-27 text-right font-semibold tnum">
            {formatMoney(order.total)}
          </span>
        </li>
      ))}
    </ul>
  );
}
