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
    return <p className="text-stone-500">Завантаження…</p>;
  }
  if (error) {
    return <p className="rounded bg-red-50 p-3 text-red-700">{error.message}</p>;
  }

  return (
    <article>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Замовлення №{order.number}</h1>
        <OrderStatusBadge status={order.status} />
      </div>
      <p className="mt-1 text-sm text-stone-500">{formatDate(order.createdAt)}</p>

      <ul className="mt-6 divide-y divide-amber-200 rounded-xl border border-amber-200 bg-white">
        {order.items.map((item) => (
          <li key={item.productId} className="flex items-center justify-between gap-4 p-4">
            <div>
              <p className="font-medium">{item.title}</p>
              {/* Price as it was when the order was placed, not today's. */}
              <p className="text-sm text-stone-500">
                {item.qty} × {formatMoney(item.unitPrice)}
              </p>
            </div>
            <span className="font-semibold">{formatMoney(item.lineTotal)}</span>
          </li>
        ))}
      </ul>

      <p className="mt-4 text-right text-xl">
        Разом: <span className="font-semibold">{formatMoney(order.total)}</span>
      </p>

      <section className="mt-8 rounded-xl border border-amber-200 bg-white p-4 text-sm">
        <h2 className="font-medium">Доставка</h2>
        <dl className="mt-2 grid gap-1 text-stone-600">
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

      {cancel.error && (
        <p className="mt-4 rounded bg-red-50 p-3 text-sm text-red-700">{cancel.error.message}</p>
      )}

      <div className="mt-6 flex items-center gap-4">
        <Link href="/orders" className="text-amber-700 underline">
          Усі замовлення
        </Link>
        {CANCELLABLE.includes(order.status) && (
          <button
            type="button"
            onClick={() => cancel.mutate()}
            disabled={cancel.isPending}
            className="rounded border border-red-300 px-4 py-2 text-sm text-red-700 hover:bg-red-50 disabled:opacity-50"
          >
            {cancel.isPending ? 'Скасовуємо…' : 'Скасувати замовлення'}
          </button>
        )}
      </div>
    </article>
  );
}
