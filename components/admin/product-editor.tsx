'use client';

import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { api } from '@/lib/api/client';
import { messageOf } from '@/lib/api/errors';
import { formatMoney } from '@/lib/format';

const MAX_TIERS = 4;

type TierRole = 'CUSTOMER' | 'DEALER';

const ROLE_TITLE: Record<TierRole, string> = {
  CUSTOMER: 'Користувач',
  DEALER: 'Курєр',
};

const ROLE_HINT: Record<TierRole, string> = {
  CUSTOMER: 'Звичайні покупці. Пороги невеликі.',
  DEALER: 'Курєри беруть гурт: пороги вищі, ціни значно нижчі.',
};

interface Tier {
  id: string;
  role: string;
  minQty: number;
  price: string;
}

export function ProductEditor({ id }: { id: string }) {
  const queryClient = useQueryClient();
  const [saved, setSaved] = useState(false);

  const { data: product, isPending, error } = useQuery({
    queryKey: ['admin', 'product', id],
    queryFn: async () => {
      const { data, error: apiError } = await api.GET('/products/by-id/{id}', {
        params: { path: { id } },
      });
      if (apiError || !data) throw new Error(messageOf(apiError, 'Товар не знайдено'));
      return data as {
        id: string;
        title: string;
        slug: string;
        description: string | null;
        unit: string;
        stock: number;
        basePrice: string;
        isActive: boolean;
        tiersByRole: Record<TierRole, Tier[]>;
      };
    },
  });

  const save = useMutation({
    mutationFn: async (form: FormData) => {
      const { data, error: apiError } = await api.PATCH('/products/{id}', {
        params: { path: { id } },
        body: {
          title: String(form.get('title')),
          slug: String(form.get('slug')),
          description: String(form.get('description') ?? '') || undefined,
          unit: String(form.get('unit')),
          basePrice: Number(form.get('basePrice')),
          stock: Number(form.get('stock')),
          isActive: form.get('isActive') === 'on',
        },
      });
      if (apiError || !data) throw new Error(messageOf(apiError, 'Не вдалося зберегти'));
      return data;
    },
    onSuccess: () => {
      setSaved(true);
      void queryClient.invalidateQueries({ queryKey: ['admin'] });
    },
  });

  const addTier = useMutation({
    mutationFn: async ({ role, minQty, price }: { role: TierRole; minQty: number; price: number }) => {
      const { data, error: apiError } = await api.POST('/products/{id}/tiers', {
        params: { path: { id } },
        body: { role, minQty, price },
      });
      if (apiError || !data) throw new Error(messageOf(apiError, 'Не вдалося додати поріг'));
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'product', id] }),
  });

  const removeTier = useMutation({
    mutationFn: async (tierId: string) => {
      const { error: apiError } = await api.DELETE('/products/{id}/tiers/{tierId}', {
        params: { path: { id, tierId } },
      });
      if (apiError) {
        throw new Error(messageOf(apiError, 'Не вдалося прибрати поріг'));
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin', 'product', id] }),
  });

  if (isPending) return <p className="text-stone-500">Завантаження…</p>;
  if (error) return <p className="rounded bg-red-50 p-3 text-red-700">{error.message}</p>;

  return (
    <>
      <Link href="/admin/products" className="text-sm text-amber-700 underline">
        ← Усі товари
      </Link>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          setSaved(false);
          save.mutate(new FormData(e.currentTarget));
        }}
        className="mt-4 grid gap-4 rounded-xl border border-amber-200 bg-white p-4 sm:grid-cols-2"
      >
        <h1 className="text-xl font-semibold sm:col-span-2">{product.title}</h1>

        <label className="text-sm font-medium">
          Назва
          <input
            name="title"
            defaultValue={product.title}
            required
            className="mt-1 w-full rounded border border-amber-300 px-3 py-2"
          />
        </label>
        <label className="text-sm font-medium">
          Slug
          <input
            name="slug"
            defaultValue={product.slug}
            required
            pattern="[a-z0-9]+(-[a-z0-9]+)*"
            className="mt-1 w-full rounded border border-amber-300 px-3 py-2"
          />
        </label>
        <label className="text-sm font-medium sm:col-span-2">
          Опис
          <textarea
            name="description"
            rows={2}
            defaultValue={product.description ?? ''}
            className="mt-1 w-full rounded border border-amber-300 px-3 py-2"
          />
        </label>
        <label className="text-sm font-medium">
          Ціна без знижок, грн
          <input
            name="basePrice"
            type="number"
            step="0.01"
            min="0"
            defaultValue={product.basePrice}
            required
            className="mt-1 w-full rounded border border-amber-300 px-3 py-2"
          />
        </label>
        <div className="grid grid-cols-2 gap-4">
          <label className="text-sm font-medium">
            Одиниця
            <input
              name="unit"
              defaultValue={product.unit}
              className="mt-1 w-full rounded border border-amber-300 px-3 py-2"
            />
          </label>
          <label className="text-sm font-medium">
            Залишок
            <input
              name="stock"
              type="number"
              min="0"
              defaultValue={product.stock}
              className="mt-1 w-full rounded border border-amber-300 px-3 py-2"
            />
          </label>
        </div>

        <label className="flex items-center gap-2 text-sm sm:col-span-2">
          <input type="checkbox" name="isActive" defaultChecked={product.isActive} />
          Показувати в каталозі
        </label>

        {save.error && (
          <p className="rounded bg-red-50 p-3 text-sm text-red-700 sm:col-span-2">
            {(save.error as Error).message}
          </p>
        )}
        {saved && !save.isPending && (
          <p className="rounded bg-green-50 p-3 text-sm text-green-700 sm:col-span-2">
            Збережено. Ціни в уже оформлених замовленнях не змінились.
          </p>
        )}

        <button
          type="submit"
          disabled={save.isPending}
          className="rounded-lg bg-amber-500 px-4 py-2 font-medium text-white hover:bg-amber-600 disabled:bg-stone-300 sm:col-span-2"
        >
          {save.isPending ? 'Зберігаємо…' : 'Зберегти'}
        </button>
      </form>

      <h2 className="mt-8 text-lg font-semibold">Пороги знижок</h2>
      <p className="mt-1 text-sm text-stone-600">
        Кожен поріг вмикається, коли кількість одного товару досягає вказаної. Драбини для
        користувача та курєра незалежні, до {MAX_TIERS} порогів у кожній.
      </p>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        {(['CUSTOMER', 'DEALER'] as TierRole[]).map((role) => (
          <TierLadder
            key={role}
            role={role}
            unit={product.unit}
            basePrice={product.basePrice}
            tiers={product.tiersByRole[role] ?? []}
            onAdd={(minQty, price) => addTier.mutate({ role, minQty, price })}
            onRemove={(tierId) => removeTier.mutate(tierId)}
            error={addTier.error ? (addTier.error as Error).message : null}
          />
        ))}
      </div>
    </>
  );
}

function TierLadder({
  role,
  unit,
  basePrice,
  tiers,
  onAdd,
  onRemove,
  error,
}: {
  role: TierRole;
  unit: string;
  basePrice: string;
  tiers: Tier[];
  onAdd: (minQty: number, price: number) => void;
  onRemove: (tierId: string) => void;
  error: string | null;
}) {
  const full = tiers.length >= MAX_TIERS;

  return (
    <section aria-label={ROLE_TITLE[role]} className="rounded-xl border border-amber-200 bg-white p-4">
      <h3 className="font-medium">{ROLE_TITLE[role]}</h3>
      <p className="mt-1 text-sm text-stone-500">{ROLE_HINT[role]}</p>

      <table className="mt-3 w-full text-sm">
        <tbody className="divide-y divide-amber-100">
          <tr className="text-stone-500">
            <td className="py-2">без порога</td>
            <td className="py-2 text-right">{formatMoney(basePrice)}</td>
            <td />
          </tr>
          {tiers.map((tier) => (
            <tr key={tier.id}>
              <td className="py-2">
                від {tier.minQty} {unit}
              </td>
              <td className="py-2 text-right font-medium">{formatMoney(tier.price)}</td>
              <td className="py-2 pl-3 text-right">
                <button
                  type="button"
                  onClick={() => onRemove(tier.id)}
                  className="text-xs text-stone-500 hover:text-red-700"
                >
                  прибрати
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          const form = new FormData(e.currentTarget);
          onAdd(Number(form.get('minQty')), Number(form.get('price')));
          e.currentTarget.reset();
        }}
        className="mt-4 flex flex-wrap items-end gap-2"
      >
        <label className="text-xs text-stone-600">
          від, {unit}
          <input
            name="minQty"
            type="number"
            min="1"
            required
            className="mt-1 block h-9 w-24 rounded border border-amber-300 px-2"
          />
        </label>
        <label className="text-xs text-stone-600">
          ціна, грн
          <input
            name="price"
            type="number"
            step="0.01"
            min="0"
            required
            className="mt-1 block h-9 w-28 rounded border border-amber-300 px-2"
          />
        </label>
        <button
          type="submit"
          disabled={full}
          className="h-9 rounded bg-amber-500 px-3 text-sm font-medium text-white hover:bg-amber-600 disabled:bg-stone-300"
          // Sending the same threshold again edits its price instead of
          // adding a row, which is why a full ladder is still editable.
          title={full ? `Уже ${MAX_TIERS} пороги` : undefined}
        >
          Додати
        </button>
      </form>

      {full && <p className="mt-2 text-xs text-stone-500">Максимум {MAX_TIERS} порогів.</p>}
      {error && <p className="mt-2 rounded bg-red-50 p-2 text-xs text-red-700">{error}</p>}
    </section>
  );
}
