'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { api } from '@/lib/api/client';
import { messageOf } from '@/lib/api/errors';
import { formatDate, formatMoney } from '@/lib/format';
import { ORDER_STATUS, OrderStatusBadge } from '@/components/orders-list';
import { BasketIcon } from '@/components/icons';
import { ConfirmDialog } from './confirm-dialog';
import { useDebounced } from '@/lib/use-debounced';
import type { Order } from '@/lib/api/types';

type Status = Order['status'];

/**
 * Mirrors ORDER_TRANSITIONS on the server. The server stays the authority -
 * it answers 409 to anything else - but the admin should not be offered a
 * move that is going to be refused.
 */
const NEXT_STATUSES: Record<Status, readonly Status[]> = {
  CREATED: ['PENDING_PAYMENT', 'PAID', 'CANCELLED'],
  PENDING_PAYMENT: ['PAID', 'CANCELLED'],
  PAID: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['DONE'],
  DONE: [],
  CANCELLED: [],
};

/**
 * Every move is one-way, so every move asks first - and says what it costs.
 * Two of them the system can make on its own (an online payment moves an
 * order to PENDING_PAYMENT and then to PAID); the rest only ever happen
 * because an admin decided so.
 */
const MOVE_COPY: Record<
  Status,
  {
    title: (order: Order) => string;
    body: (order: Order) => React.ReactNode;
    confirm: string;
    tone: 'danger' | 'primary';
  }
> = {
  CREATED: {
    title: (o) => `Повернути замовлення №${o.number} у «Прийнято»?`,
    body: () => 'Змінити статус ще раз назад буде неможливо.',
    confirm: 'Перевести',
    tone: 'primary',
  },
  PENDING_PAYMENT: {
    title: (o) => `Перевести замовлення №${o.number} в «Очікує оплати»?`,
    body: () =>
      'Так позначають замовлення, за яке вже виставлено рахунок. При онлайн-оплаті це робить система сама. Повернути в «Прийнято» після цього не можна.',
    confirm: 'Перевести',
    tone: 'primary',
  },
  PAID: {
    title: (o) => `Позначити замовлення №${o.number} оплаченим?`,
    body: (o) => (
      <>
        Сума {formatMoney(o.total)} одразу потрапить у виторг статистики. При онлайн-оплаті цей
        статус ставить вебхук банку — вручну його ставлять для оплати при отриманні. Назад дороги
        немає.
      </>
    ),
    confirm: 'Позначити оплаченим',
    tone: 'primary',
  },
  SHIPPED: {
    title: (o) => `Замовлення №${o.number} відправлене?`,
    body: (o) => (
      <>
        Переконайтесь, що посилка справді пішла на {o.city}, {o.warehouse}. Далі з цього статусу
        веде лише «Виконано» — ні скасувати, ні повернути в «Оплачено» вже не вийде.
      </>
    ),
    confirm: 'Позначити відправленим',
    tone: 'primary',
  },
  DONE: {
    title: (o) => `Позначити замовлення №${o.number} виконаним?`,
    body: () => '«Виконано» — кінцевий статус: змінити його потім не вийде.',
    confirm: 'Позначити виконаним',
    tone: 'primary',
  },
  CANCELLED: {
    title: (o) => `Скасувати замовлення №${o.number}?`,
    body: (o) => (
      <>
        Скасування незворотне — повернути замовлення в роботу вже не можна. На склад повернеться:{' '}
        {o.items.map((item) => `${item.title} — ${item.qty}`).join(', ')}.
      </>
    ),
    confirm: 'Скасувати замовлення',
    tone: 'danger',
  },
};

const FILTERS: readonly { value: Status | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'Усі' },
  { value: 'CREATED', label: 'Прийнято' },
  { value: 'PENDING_PAYMENT', label: 'Очікує оплати' },
  { value: 'PAID', label: 'Оплачено' },
  { value: 'SHIPPED', label: 'Відправлено' },
  { value: 'DONE', label: 'Виконано' },
  { value: 'CANCELLED', label: 'Скасовано' },
];

export function OrdersBoard() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<Status | 'ALL'>('ALL');
  const [term, setTerm] = useState('');
  const [page, setPage] = useState(1);
  const q = useDebounced(term);
  /// The move waiting for a yes. Every move waits: none of them can be undone.
  const [asking, setAsking] = useState<{ order: Order; status: Status } | null>(null);

  /**
   * For an admin this endpoint returns the whole shop, not one buyer - which
   * is exactly why it comes a page at a time. Filtering and searching happen
   * on the server too: narrowing a single page would hide the rest.
   */
  const { data, isFetching, error } = useQuery({
    queryKey: ['admin', 'orders', { q, filter, page }],
    queryFn: async () => {
      const { data: payload, error: apiError } = await api.GET('/orders', {
        params: {
          query: {
            page,
            ...(q ? { q } : {}),
            ...(filter === 'ALL' ? {} : { status: filter }),
          },
        },
      });
      if (apiError || !payload) {
        throw new Error('Не вдалося завантажити замовлення');
      }
      return payload;
    },
    placeholderData: (previous) => previous,
  });

  const move = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: Status }) => {
      const { data, error: apiError } = await api.PATCH('/orders/{id}/status', {
        params: { path: { id } },
        body: { status },
      });
      if (apiError || !data) {
        throw new Error(messageOf(apiError, 'Не вдалося змінити статус'));
      }
      return data;
    },
    onSuccess: () => {
      setAsking(null);
      void queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] });
      // The money tiles count only paid and done orders.
      void queryClient.invalidateQueries({ queryKey: ['stats'] });
    },
  });

  if (error) {
    return <p className="alert alert-danger">{error.message}</p>;
  }
  if (!data) {
    return <p className="text-neutral-600">Завантаження…</p>;
  }

  // Counts come from the server and describe the whole search, not the page
  // on screen.
  const counts = data.counts as Record<string, number>;
  const everything = Object.values(counts).reduce((sum, n) => sum + n, 0);
  const shown = data.items;

  const choose = (value: Status | 'ALL') => {
    setFilter(value);
    setPage(1);
  };

  return (
    <>
      <label className="mb-4 block text-sm font-medium">
        Пошук
        <input
          className="input mt-1"
          value={term}
          onChange={(e) => {
            setTerm(e.target.value);
            setPage(1);
          }}
          placeholder="Номер, отримувач, телефон, місто або товар"
          autoComplete="off"
        />
      </label>

      <div className="filter-row" role="group" aria-label="Фільтр за статусом">
        {FILTERS.map(({ value, label }) => {
          const count = value === 'ALL' ? everything : (counts[value] ?? 0);
          return (
            <button
              key={value}
              type="button"
              onClick={() => choose(value)}
              aria-pressed={filter === value}
              className={`filter-chip ${filter === value ? 'filter-chip-on' : ''}`}
            >
              {label} <span className="tnum opacity-60">{count}</span>
            </button>
          );
        })}
      </div>

      {move.error && !asking && <p className="alert alert-danger mt-4">{move.error.message}</p>}

      {shown.length === 0 ? (
        <p className="mt-6 text-neutral-600">
          {q ? 'За таким запитом нічого не знайшлося.' : 'Замовлень із цим статусом немає.'}
        </p>
      ) : (
        <ul className={`card elev-sm mt-4 ${isFetching ? 'opacity-60' : ''}`}>
          {shown.map((order) => (
            <li key={order.id} className="admin-order">
              <details>
                <summary className="admin-order-head">
                  <span className="order-icon">
                    <BasketIcon />
                  </span>

                  <span className="min-w-40 flex-1">
                    <span className="font-semibold">Замовлення №{order.number}</span>
                    <span className="block text-[13px] text-neutral-600">
                      {formatDate(order.createdAt)} · {order.customerName}
                    </span>
                  </span>

                  <OrderStatusBadge status={order.status} />
                  <span className="min-w-27 text-right font-semibold tnum">
                    {formatMoney(order.total)}
                  </span>
                </summary>

                <div className="admin-order-body">
                  <ul className="text-[14px]">
                    {order.items.map((item) => (
                      <li key={item.productId} className="flex justify-between gap-4 py-1">
                        <span>
                          {item.title}{' '}
                          <span className="text-neutral-600 tnum">
                            {item.qty} × {formatMoney(item.unitPrice)}
                          </span>
                        </span>
                        <span className="tnum">{formatMoney(item.lineTotal)}</span>
                      </li>
                    ))}
                  </ul>

                  <p className="mt-3 text-[14px] text-neutral-700">
                    {order.customerPhone} · {order.city}, {order.warehouse}
                    {order.comment && ` · «${order.comment}»`}
                  </p>

                  {NEXT_STATUSES[order.status].length > 0 ? (
                    <>
                      <div className="mt-4 flex flex-wrap items-center gap-2">
                        <span className="text-[13px] text-neutral-600">Перевести в:</span>
                        {NEXT_STATUSES[order.status].map((status) => (
                          <button
                            key={status}
                            type="button"
                            disabled={move.isPending}
                            onClick={() => setAsking({ order, status })}
                            className={
                              status === 'CANCELLED' ? 'btn btn-danger' : 'btn btn-secondary'
                            }
                          >
                            {ORDER_STATUS[status].label}
                          </button>
                        ))}
                      </div>
                      <p className="mt-2 text-[12px] text-neutral-600">
                        Переходи односторонні: повернути попередній статус не можна.
                      </p>
                    </>
                  ) : (
                    <p className="mt-4 text-[13px] text-neutral-600">
                      Кінцевий статус — далі рухати нікуди.
                    </p>
                  )}
                </div>
              </details>
            </li>
          ))}
        </ul>
      )}

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

      {asking && (
        <ConfirmDialog
          open
          title={MOVE_COPY[asking.status].title(asking.order)}
          description={MOVE_COPY[asking.status].body(asking.order)}
          confirmLabel={MOVE_COPY[asking.status].confirm}
          pendingLabel="Зберігаємо…"
          tone={MOVE_COPY[asking.status].tone}
          pending={move.isPending}
          error={move.error ? move.error.message : null}
          onCancel={() => {
            move.reset();
            setAsking(null);
          }}
          onConfirm={() => move.mutate({ id: asking.order.id, status: asking.status })}
        />
      )}
    </>
  );
}
