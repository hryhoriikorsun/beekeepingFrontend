'use client';

import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { messageOf } from '@/lib/api/errors';
import { formatDate, formatMoney } from '@/lib/format';
import { OrderStatusBadge } from './orders-list';
import type { Order } from '@/lib/api/types';

const CANCELLABLE: Order['status'][] = ['CREATED', 'PENDING_PAYMENT'];

export function OrderDetail({ id }: { id: string }) {
  const queryClient = useQueryClient();

  const { data: order, isPending, error } = useQuery({
    queryKey: ['order', id],
    queryFn: async (): Promise<Order> => {
      const { data, error: apiError } = await api.GET('/orders/{id}', {
        params: { path: { id } },
      });
      if (apiError || !data) {
        throw new Error(messageOf(apiError, 'Замовлення не знайдено'));
      }
      return data;
    },
  });

  const cancel = useMutation({
    mutationFn: async () => {
      const { data, error: apiError } = await api.PATCH('/orders/{id}/cancel', {
        params: { path: { id } },
      });
      if (apiError || !data) {
        throw new Error(messageOf(apiError, 'Не вдалося скасувати'));
      }
      return data;
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(['order', id], updated);
      void queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
  });

  if (isPending) {
    return <p className="text-neutral-600">Завантаження…</p>;
  }
  if (error) {
    return <p className="alert alert-danger">{error.message}</p>;
  }

  return (
    <article>
      <div className="page-head mb-2">
        <h1>Замовлення №{order.number}</h1>
        <OrderStatusBadge status={order.status} />
      </div>
      <p className="text-[13px] text-neutral-600">{formatDate(order.createdAt)}</p>

      <ul className="card elev-sm mt-6">
        {order.items.map((item) => (
          <li key={item.productId} className="cart-row">
            <div className="flex-1">
              <p className="font-semibold">{item.title}</p>
              {/* Price as it was when the order was placed, not today's. */}
              <p className="text-[13px] text-neutral-600 tnum">
                {item.qty} × {formatMoney(item.unitPrice)}
              </p>
            </div>
            <span className="font-semibold tnum">{formatMoney(item.lineTotal)}</span>
          </li>
        ))}
      </ul>

      <p className="mt-4 text-right font-heading text-[22px] font-extrabold">
        Разом: <span className="tnum">{formatMoney(order.total)}</span>
      </p>

      <section className="card elev-sm mt-8">
        <h2 className="text-[19px]">Доставка</h2>
        <dl className="mt-2 grid gap-1 text-[14px] text-neutral-700">
          <div className="flex gap-2">
            <dt>Отримувач:</dt>
            <dd>{order.customerName}</dd>
          </div>
          <div className="flex gap-2">
            <dt>Телефон:</dt>
            <dd>{order.customerPhone}</dd>
          </div>
          <div className="flex gap-2">
            <dt>Куди:</dt>
            <dd>
              {order.city}, {order.warehouse}
            </dd>
          </div>
          {order.comment && (
            <div className="flex gap-2">
              <dt>Коментар:</dt>
              <dd>{order.comment}</dd>
            </div>
          )}
        </dl>
      </section>

      {cancel.error && <p className="alert alert-danger mt-4">{cancel.error.message}</p>}

      <div className="mt-6 flex flex-wrap items-center gap-4">
        <Link href="/orders">Усі замовлення</Link>
        {CANCELLABLE.includes(order.status) && (
          <button
            type="button"
            onClick={() => cancel.mutate()}
            disabled={cancel.isPending}
            className="btn btn-danger"
          >
            {cancel.isPending ? 'Скасовуємо…' : 'Скасувати замовлення'}
          </button>
        )}
      </div>
    </article>
  );
}
