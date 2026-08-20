'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { api } from '@/lib/api/client';
import { formatDate, formatMoney } from '@/lib/format';
import { BasketIcon } from './icons';
import { useDebounced } from '@/lib/use-debounced';
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
  const [term, setTerm] = useState('');
  const [status, setStatus] = useState<Order['status'] | ''>('');
  const [page, setPage] = useState(1);
  const q = useDebounced(term);

  const { data, isFetching, error } = useQuery({
    queryKey: ['orders', { q, status, page }],
    queryFn: async () => {
      const { data: payload, error: apiError } = await api.GET('/orders', {
        params: {
          query: {
            page,
            ...(q ? { q } : {}),
            ...(status ? { status } : {}),
          },
        },
      });
      if (apiError || !payload) {
        throw new Error('Не вдалося завантажити замовлення');
      }
      return payload;
    },
    // Keeps the previous page on screen while the next one loads, so the
    // list does not collapse to a spinner on every click.
    placeholderData: (previous) => previous,
  });

  const filtered = Boolean(q || status);

  return (
    <>
      <div className="mb-4 flex flex-wrap items-end gap-3">
        <label className="flex-1 text-sm font-medium">
          Пошук
          <input
            className="input mt-1"
            value={term}
            onChange={(e) => {
              // A new filter starts at the first page: page 3 of the previous
              // result says nothing about this one.
              setTerm(e.target.value);
              setPage(1);
            }}
            placeholder="Номер, отримувач, телефон, місто або товар"
            autoComplete="off"
          />
        </label>

        <label className="text-sm font-medium">
          Статус
          <select
            className="input mt-1"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as Order['status'] | '');
              setPage(1);
            }}
          >
            <option value="">Будь-який</option>
            {Object.entries(ORDER_STATUS).map(([value, { label }]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>

        {filtered && (
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => {
              setTerm('');
              setStatus('');
              setPage(1);
            }}
          >
            Скинути
          </button>
        )}
      </div>

      {error && <p className="alert alert-danger">{error.message}</p>}

      {!data ? (
        <p className="text-neutral-600">Завантаження…</p>
      ) : data.items.length === 0 ? (
        <div className="card elev-sm py-8 text-center">
          <p className="mb-3 text-neutral-700">
            {filtered ? 'За таким запитом нічого не знайшлося.' : 'Замовлень поки немає.'}
          </p>
          <Link href="/" className="btn btn-secondary">
            До каталогу
          </Link>
        </div>
      ) : (
        <>
          <ul className={`card elev-sm ${isFetching ? 'opacity-60' : ''}`}>
            {data.items.map((order) => (
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

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm">
            <span className="text-neutral-600">
              Знайдено {data.total} · сторінка {data.page} з {data.pages}
            </span>

            {data.pages > 1 && (
              <div className="flex gap-2">
                <button
                  type="button"
                  className="btn btn-secondary"
                  disabled={data.page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Назад
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  disabled={data.page >= data.pages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Далі
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}
