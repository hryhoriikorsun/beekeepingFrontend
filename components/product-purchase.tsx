'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { api } from '@/lib/api/client';
import { useAuthStore } from '@/lib/auth/store';
import { useCartStore } from '@/lib/cart/store';
import { formatMoney } from '@/lib/format';
import type { Product } from '@/lib/api/types';

export function ProductPurchase({ initial }: { initial: Product }) {
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const role = useAuthStore((s) => s.user?.role ?? null);
  const addToCart = useCartStore((s) => s.add);

  /**
   * The price is never computed here. Quantity and role decide which tier
   * applies, and only the server knows the tiers - the frontend just asks
   * again and shows the answer.
   */
  const { data: product = initial, isFetching } = useQuery({
    queryKey: ['product', initial.slug, qty, role],
    queryFn: async () => {
      const { data, error } = await api.GET('/products/{slug}', {
        params: { path: { slug: initial.slug }, query: { qty } },
      });
      if (error || !data) {
        throw new Error('Не вдалося отримати ціну');
      }
      return data;
    },
    initialData: qty === 1 && !role ? initial : undefined,
    placeholderData: (previous) => previous,
  });

  const outOfStock = product.stock < 1;
  const tooMany = qty > product.stock;

  return (
    <div className="rounded-xl border border-amber-200 bg-white p-6">
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-semibold">{formatMoney(product.unitPrice)}</span>
        <span className="text-stone-500">/ {product.unit}</span>
      </div>

      {product.appliedTier && (
        <p className="mt-1 text-sm text-green-700">
          Гуртова ціна від {product.appliedTier.minQty} {product.unit}. Роздрібна —{' '}
          <s>{formatMoney(product.basePrice)}</s>
        </p>
      )}

      {product.nextTierAtQty && (
        <p className="mt-1 text-sm text-amber-700">
          Візьміть {product.nextTierAtQty} {product.unit} — і ціна стане нижчою
        </p>
      )}

      <label className="mt-6 block text-sm font-medium" htmlFor="qty">
        Кількість, {product.unit}
      </label>
      <div className="mt-2 flex items-center gap-3">
        <button
          type="button"
          onClick={() => setQty((q) => Math.max(1, q - 1))}
          className="h-10 w-10 rounded border border-amber-300 text-lg hover:bg-amber-50"
          aria-label="Зменшити кількість"
        >
          −
        </button>
        <input
          id="qty"
          type="number"
          min={1}
          value={qty}
          onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))}
          className="h-10 w-20 rounded border border-amber-300 px-3 text-center"
        />
        <button
          type="button"
          onClick={() => setQty((q) => q + 1)}
          className="h-10 w-10 rounded border border-amber-300 text-lg hover:bg-amber-50"
          aria-label="Збільшити кількість"
        >
          +
        </button>
      </div>

      <p className="mt-4 text-lg">
        Разом: <span className="font-semibold">{formatMoney(product.total)}</span>
        {isFetching && <span className="ml-2 text-sm text-stone-400">оновлюємо…</span>}
      </p>

      <button
        type="button"
        disabled={outOfStock || tooMany}
        onClick={() => {
          addToCart({
            productId: product.id,
            slug: product.slug,
            title: product.title,
            unit: product.unit,
            qty,
          });
          setAdded(true);
        }}
        className="mt-4 w-full rounded-lg bg-amber-500 px-4 py-3 font-medium text-white transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:bg-stone-300"
      >
        {outOfStock ? 'Немає в наявності' : tooMany ? 'Стільки немає на складі' : 'Додати в кошик'}
      </button>

      {added && !tooMany && (
        <p className="mt-2 text-center text-sm text-green-700">Додано до кошика</p>
      )}
    </div>
  );
}
