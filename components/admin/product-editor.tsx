'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { ConfirmDialog } from './confirm-dialog';
import { ImagePicker } from './image-picker';
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
  const router = useRouter();
  const [saved, setSaved] = useState(false);
  const [confirming, setConfirming] = useState(false);

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
        imageUrl: string | null;
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
          // null, not undefined: choosing "no photo" has to take the old one off.
          imageUrl: String(form.get('imageUrl') ?? '') || null,
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

  const remove = useMutation({
    mutationFn: async () => {
      const { error: apiError } = await api.DELETE('/products/{id}', {
        params: { path: { id } },
      });
      if (apiError) {
        throw new Error(messageOf(apiError, 'Не вдалося видалити товар'));
      }
    },
    onSuccess: () => {
      setConfirming(false);
      void queryClient.invalidateQueries({ queryKey: ['admin'] });
      router.push('/admin/products');
    },
  });

  if (isPending) return <p className="text-neutral-600">Завантаження…</p>;
  if (error) return <p className="alert alert-danger">{error.message}</p>;

  return (
    <>
      <Link href="/admin/products" className="back-btn">
        ← Усі товари
      </Link>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          setSaved(false);
          save.mutate(new FormData(e.currentTarget));
        }}
        className="mt-4 grid gap-4 card elev-sm p-4 sm:grid-cols-2"
      >
        <h1 className="text-xl font-semibold sm:col-span-2">{product.title}</h1>

        <label className="text-sm font-medium">
          Назва
          <input
            name="title"
            defaultValue={product.title}
            required
            className="input mt-1"
          />
        </label>
        <label className="text-sm font-medium">
          Slug
          <input
            name="slug"
            defaultValue={product.slug}
            required
            pattern="[a-z0-9]+(-[a-z0-9]+)*"
            className="input mt-1"
          />
        </label>
        <label className="text-sm font-medium sm:col-span-2">
          Опис
          <textarea
            name="description"
            rows={2}
            defaultValue={product.description ?? ''}
            className="input mt-1"
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
            className="input mt-1"
          />
        </label>
        <div className="grid grid-cols-2 gap-4">
          <label className="text-sm font-medium">
            Одиниця
            <input
              name="unit"
              defaultValue={product.unit}
              className="input mt-1"
            />
          </label>
          <label className="text-sm font-medium">
            Залишок
            <input
              name="stock"
              type="number"
              min="0"
              defaultValue={product.stock}
              className="input mt-1"
            />
          </label>
        </div>

        <ImagePicker name="imageUrl" defaultValue={product.imageUrl} />

        <label className="flex items-center gap-2 text-sm sm:col-span-2">
          <input type="checkbox" name="isActive" defaultChecked={product.isActive} />
          Показувати в каталозі
        </label>

        {save.error && (
          <p className="alert alert-danger sm:col-span-2">
            {(save.error as Error).message}
          </p>
        )}
        {saved && !save.isPending && (
          <p className="alert alert-success sm:col-span-2">
            Збережено. Ціни в уже оформлених замовленнях не змінились.
          </p>
        )}

        <button
          type="submit"
          disabled={save.isPending}
          className="btn btn-primary sm:col-span-2"
        >
          {save.isPending ? 'Зберігаємо…' : 'Зберегти'}
        </button>
      </form>

      <h2 className="mt-8 text-lg font-semibold">Пороги знижок</h2>
      <p className="mt-1 text-sm text-neutral-700">
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

      <section aria-label="Видалення товару" className="mt-8 card elev-sm p-4">
        <h2 className="text-[19px] font-semibold">Видалити товар</h2>
        <p className="mt-1 text-sm text-neutral-700">
          Товар і його пороги зникнуть назавжди. Оформлені замовлення це не змінить — вони
          зберігають власну копію назви й ціни. Якщо товар просто закінчився, приберіть його
          з каталогу галочкою вище.
        </p>
        <button
          type="button"
          className="btn btn-danger mt-4"
          onClick={() => setConfirming(true)}
        >
          Видалити товар
        </button>
      </section>

      <ConfirmDialog
        open={confirming}
        expected={product.title}
        title="Видалити товар?"
        description="Цю дію не можна скасувати."
        confirmLabel="Видалити"
        pendingLabel="Видаляємо…"
        pending={remove.isPending}
        error={remove.error ? (remove.error as Error).message : null}
        onCancel={() => {
          remove.reset();
          setConfirming(false);
        }}
        onConfirm={() => remove.mutate()}
      />
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
    <section aria-label={ROLE_TITLE[role]} className="card elev-sm p-4">
      <h3 className="font-medium">{ROLE_TITLE[role]}</h3>
      <p className="mt-1 text-sm text-neutral-600">{ROLE_HINT[role]}</p>

      <table className="mt-3 w-full text-sm">
        <tbody className="divide-y divide-neutral-200">
          <tr className="text-neutral-600">
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
                  className="text-xs text-neutral-600 hover:text-danger"
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
        <label className="text-xs text-neutral-700">
          від, {unit}
          <input
            name="minQty"
            type="number"
            min="1"
            required
            className="input mt-1 block w-24"
          />
        </label>
        <label className="text-xs text-neutral-700">
          ціна, грн
          <input
            name="price"
            type="number"
            step="0.01"
            min="0"
            required
            className="input mt-1 block w-28"
          />
        </label>
        <button
          type="submit"
          disabled={full}
          className="btn btn-primary"
          // Sending the same threshold again edits its price instead of
          // adding a row, which is why a full ladder is still editable.
          title={full ? `Уже ${MAX_TIERS} пороги` : undefined}
        >
          Додати
        </button>
      </form>

      {full && <p className="mt-2 text-xs text-neutral-600">Максимум {MAX_TIERS} порогів.</p>}
      {error && <p className="alert alert-danger mt-2">{error}</p>}
    </section>
  );
}
