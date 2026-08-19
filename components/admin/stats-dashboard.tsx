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
    <div className="rounded-xl border border-amber-200 bg-white p-4">
      <p className="text-sm text-stone-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
      {hint && <p className="mt-1 text-sm text-stone-500">{hint}</p>}
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
    return <p className="rounded bg-red-50 p-3 text-red-700">{overview.error.message}</p>;
  }
  if (!overview.data) {
    return <p className="text-stone-500">Завантаження…</p>;
  }

  const stats = overview.data;

  return (
    <div className="space-y-8">
      <section>
        <h2 className="mb-3 text-sm text-stone-500">За останні 30 днів</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Tile label="Виторг" value={formatMoney(stats.revenue)} hint="оплачені та виконані" />
          <Tile label="Замовлень" value={String(stats.orders)} />
          <Tile label="Середній чек" value={formatMoney(stats.averageOrder)} />
          <Tile label="Продано одиниць" value={String(stats.unitsSold)} />
        </div>
        {/* Money not yet earned is shown apart from money earned. Adding the
            two together is how a shop lies to itself. */}
        <p className="mt-3 text-sm text-stone-500">
          Очікують оплати: {stats.pipeline.orders} замовл. на{' '}
          {formatMoney(stats.pipeline.amount)} · покупців: {stats.buyers}
        </p>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div>
          <h2 className="mb-3 font-medium">Замовлення за статусами</h2>
          <table className="w-full text-sm">
            <tbody className="divide-y divide-amber-100">
              {byStatus.data?.map((row) => (
                <tr key={row.status}>
                  <td className="py-2">{ORDER_STATUS[row.status].label}</td>
                  <td className="py-2 text-right text-stone-500">{row.orders}</td>
                  <td className="py-2 text-right">{formatMoney(row.amount)}</td>
                  <td className="py-2 pl-3 text-right text-xs text-stone-400">
                    {row.countsAsRevenue ? 'у виторгу' : ''}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div>
          <h2 className="mb-3 font-medium">Хто купує</h2>
          <table className="w-full text-sm">
            <tbody className="divide-y divide-amber-100">
              {byRole.data?.length ? (
                byRole.data.map((row) => (
                  <tr key={row.role}>
                    <td className="py-2">{ROLE_LABEL[row.role] ?? row.role}</td>
                    <td className="py-2 text-right text-stone-500">{row.orders} зам.</td>
                    <td className="py-2 text-right">{formatMoney(row.revenue)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="py-2 text-stone-500">Поки немає оплачених замовлень</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div>
          <h2 className="mb-3 font-medium">Топ товарів</h2>
          <table className="w-full text-sm">
            <tbody className="divide-y divide-amber-100">
              {top.data?.length ? (
                top.data.map((row) => (
                  <tr key={row.productId}>
                    <td className="py-2">{row.title}</td>
                    <td className="py-2 text-right text-stone-500">{row.units} од.</td>
                    <td className="py-2 text-right">{formatMoney(row.revenue)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="py-2 text-stone-500">Продажів ще не було</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div>
          <h2 className="mb-3 font-medium">Закінчується</h2>
          <table className="w-full text-sm">
            <tbody className="divide-y divide-amber-100">
              {lowStock.data?.length ? (
                lowStock.data.map((row) => (
                  <tr key={row.id}>
                    <td className="py-2">{row.title}</td>
                    <td className="py-2 text-right text-red-700">залишок {row.stock}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td className="py-2 text-stone-500">Усього вистачає</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
