'use client';

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { api } from '@/lib/api/client';
import { useAuthStore } from '@/lib/auth/store';
import { useCartStore } from '@/lib/cart/store';
import { formatMoney } from '@/lib/format';
import { BasketIcon } from './icons';
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
  // A page rendered before this field existed can still be served from the
  // ISR cache after a deploy, so the shape is never assumed.
  const ladder = product.tiers ?? [];

  return (
    <div className="card elev-lg flex flex-col gap-4">
      <div>
        <div className="flex items-baseline gap-2">
          {/* Remounting on a price change replays the flash: crossing a tier
              threshold is the one moment worth animating. */}
          <span key={product.unitPrice} className="price-tag price-flash text-[34px]">
            {formatMoney(product.unitPrice)}
          </span>
          <span className="text-neutral-600">/ {product.unit}</span>
        </div>

        {product.appliedTier && (
          <p className="mt-1 text-sm text-accent-2-700">
            Ціна від {product.appliedTier.minQty} {product.unit}. Звичайна —{' '}
            <s>{formatMoney(product.basePrice)}</s>
          </p>
        )}

        {product.nextTierAtQty && (
          <p className="mt-1 text-sm text-accent-700">
            Візьміть {product.nextTierAtQty} {product.unit} — і ціна стане нижчою
          </p>
        )}
      </div>

      {ladder.length > 0 && (
        <table className="tier-table">
          <caption>Чим більше — тим дешевше</caption>
          <tbody>
            <tr className={product.appliedTier ? undefined : 'tier-row-active'}>
              <td>
                до {ladder[0].minQty - 1} {product.unit}
              </td>
              <td>{formatMoney(product.basePrice)}</td>
            </tr>
            {ladder.map((tier) => {
              // The row in force is the one the current quantity reached.
              const active = product.appliedTier?.minQty === tier.minQty;
              return (
                <tr key={tier.id} className={active ? 'tier-row-active' : undefined}>
                  <td>
                    від {tier.minQty} {product.unit}
                  </td>
                  <td>{formatMoney(tier.price)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}

      <div className="field">
        <label htmlFor="qty">Кількість, {product.unit}</label>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            className="qty-btn"
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
            className="input qty-input"
          />
          <button
            type="button"
            onClick={() => setQty((q) => q + 1)}
            className="qty-btn"
            aria-label="Збільшити кількість"
          >
            +
          </button>
        </div>
      </div>

      <p className="text-[15px]">
        Разом: <strong className="tnum">{formatMoney(product.total)}</strong>
        {isFetching && <span className="ml-2 text-sm text-neutral-600">оновлюємо…</span>}
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
        className="btn btn-primary btn-block"
      >
        <BasketIcon size={16} />
        {outOfStock ? 'Немає в наявності' : tooMany ? 'Стільки немає на складі' : 'Додати в кошик'}
      </button>

      {added && !tooMany && (
        <p className="text-center text-sm text-accent-2-700">Додано до кошика</p>
      )}
    </div>
  );
}
