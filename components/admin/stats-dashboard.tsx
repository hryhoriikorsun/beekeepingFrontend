'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { formatMoney } from '@/lib/format';
import { ORDER_STATUS } from '@/components/orders-list';

const ROLE_LABEL: Record<string, string> = {
  ADMIN: 'адміністратор',
  CUSTOMER: 'користувач',
  DEALER: 'курєр',
};

function Tile({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="card elev-sm p-4">
      <p className="text-sm text-neutral-600">{label}</p>
      <p className="mt-1">{value}</p>
      {hint && <p className="mt-1 text-sm text-neutral-600">{hint}</p>}
    </div>
  );
}

export function StatsDashboard() {
  const overview = useQuery({
    queryKey: ['stats', 'overview'],
    queryFn: async () => {
      const { data, error } = await api.GET('/admin/stats/overview', {});
      if (error || !data) throw new Error('Не вдалося завантажити статистику');
      return data;
    },
  });

  const byStatus = useQuery({
    queryKey: ['stats', 'by-status'],
    queryFn: async () => {
      const { data, error } = await api.GET('/admin/stats/by-status', {});
      if (error || !data) throw new Error('Не вдалося завантажити статуси');
      return data;
    },
  });

  const byRole = useQuery({
    queryKey: ['stats', 'by-role'],
    queryFn: async () => {
      const { data, error } = await api.GET('/admin/stats/by-role', {});
      if (error || !data) throw new Error('Не вдалося завантажити розріз за ролями');
      return data;
    },
  });

  const top = useQuery({
    queryKey: ['stats', 'top'],
    queryFn: async () => {
      const { data, error } = await api.GET('/admin/stats/top-products', {
        params: { query: { limit: 5 } },
      });
      if (error || !data) throw new Error('Не вдалося завантажити топ товарів');
      return data;
    },
  });

  const lowStock = useQuery({
    queryKey: ['stats', 'low-stock'],
    queryFn: async () => {
      const { data, error } = await api.GET('/admin/stats/low-stock', {});
      if (error || !data) throw new Error('Не вдалося завантажити залишки');
      return data;
    },
  });

  if (overview.error) {
    return <p className="alert alert-danger">{overview.error.message}</p>;
  }
  if (!overview.data) {
    return <p className="text-neutral-600">Завантаження…</p>;
  }

  const stats = overview.data;

  return (
    <div className="space-y-8">
      <section>
        <h2 className="mb-3 text-sm font-semibold text-neutral-600">За останні 30 днів</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Tile label="Виторг" value={formatMoney(stats.revenue)} hint="оплачені та виконані" />
          <Tile label="Замовлень" value={String(stats.orders)} />
          <Tile label="Середній чек" value={formatMoney(stats.averageOrder)} />
          <Tile label="Продано одиниць" value={String(stats.unitsSold)} />
        </div>
        {/* Money not yet earned is shown apart from money earned. Adding the
            two together is how a shop lies to itself. */}
        <p className="mt-3 text-sm text-neutral-600">
          Очікують оплати: {stats.pipeline.orders} замовл. на{' '}
          {formatMoney(stats.pipeline.amount)} · покупців: {stats.buyers}
        </p>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div>
          <h2 className="mb-3 text-[19px]">Замовлення за статусами</h2>
          <table className="w-full text-sm">
            <tbody className="divide-y divide-neutral-200">
              {byStatus.data?.map((row) => (
                <tr key={row.status}>
                  <td className="py-2">{ORDER_STATUS[row.status].label}</td>
                  <td className="py-2 text-right text-neutral-600">{row.orders}</td>
                  <td className="py-2 text-right">{formatMoney(row.amount)}</td>
                  <td className="py-2 pl-3 text-right text-xs text-neutral-600">
                    {row.countsAsRevenue ? 'у виторгу' : ''}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div>
          <h2 className="mb-3 text-[19px]">Хто купує</h2>
          <table className="w-full text-sm">
            <tbody className="divide-y divide-neutral-200">
              {byRole.data?.length ? (
                byRole.data.map((row) => (
                  <tr key={row.role}>
                    <td className="py-2">{ROLE_LABEL[row.role] ?? row.role}</td>
                    <td className="py-2 text-right text-neutral-600">{row.orders} зам.</td>
                    <td className="py-2 text-right">{formatMoney(row.revenue)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="py-2 text-neutral-600">Поки немає оплачених замовлень</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div>
          <h2 className="mb-3 text-[19px]">Топ товарів</h2>
          <table className="w-full text-sm">
            <tbody className="divide-y divide-neutral-200">
              {top.data?.length ? (
                top.data.map((row) => (
                  <tr key={row.productId}>
                    <td className="py-2">{row.title}</td>
                    <td className="py-2 text-right text-neutral-600">{row.units} од.</td>
                    <td className="py-2 text-right">{formatMoney(row.revenue)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="py-2 text-neutral-600">Продажів ще не було</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div>
          <h2 className="mb-3 text-[19px]">Закінчується</h2>
          <table className="w-full text-sm">
            <tbody className="divide-y divide-neutral-200">
              {lowStock.data?.length ? (
                lowStock.data.map((row) => (
                  <tr key={row.id}>
                    <td className="py-2">{row.title}</td>
                    <td className="py-2 text-right text-danger">залишок {row.stock}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="py-2 text-neutral-600">Усього вистачає</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
