'use client';

import Link from 'next/link';
import { useQueries } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { useAuthStore } from '@/lib/auth/store';
import { useCartStore } from '@/lib/cart/store';
import { formatMoney } from '@/lib/format';
import { TrashIcon } from './icons';
import type { Product } from '@/lib/api/types';

export function CartView() {
  const lines = useCartStore((s) => s.lines);
  const setQty = useCartStore((s) => s.setQty);
  const remove = useCartStore((s) => s.remove);
  const role = useAuthStore((s) => s.user?.role ?? null);

  /**
   * One query per line, each asking for that line's quantity. The tier that
   * applies depends on how many units of that product you take, so the cart
   * cannot add prices up on its own - it asks and displays.
   */
  const results = useQueries({
    queries: lines.map((line) => ({
      queryKey: ['product', line.slug, line.qty, role],
      queryFn: async (): Promise<Product> => {
        const { data, error } = await api.GET('/products/{slug}', {
          params: { path: { slug: line.slug }, query: { qty: line.qty } },
        });
        if (error || !data) {
          throw new Error('Не вдалося отримати ціну');
        }
        return data;
      },
      staleTime: 30_000,
    })),
  });

  if (lines.length === 0) {
    return (
      <div className="card elev-sm py-8 text-center">
        <p className="mb-3 text-neutral-700">Кошик порожній.</p>
        <Link href="/" className="btn btn-secondary">
          До каталогу
        </Link>
      </div>
    );
  }

  const priced = results.every((r) => r.data);
  const total = results.reduce((sum, r) => sum + Number(r.data?.total ?? 0), 0);
  const overStock = results.some((r, i) => r.data && lines[i].qty > r.data.stock);

  return (
    <div>
      <ul className="card elev-sm mb-6">
        {lines.map((line, index) => {
          const product = results[index].data;
          const tooMany = product ? line.qty > product.stock : false;

          return (
            <li key={line.productId} className="cart-row">
              <div className="min-w-35 flex-1">
                <Link href={`/products/${line.slug}`} className="font-semibold text-text">
                  {line.title}
                </Link>
                {product?.appliedTier && (
                  <p className="text-[13px] text-accent-2-700">
                    Гуртова ціна від {product.appliedTier.minQty} {line.unit}
                  </p>
                )}
                {product?.nextTierAtQty && (
                  <p className="text-[13px] text-accent-700">
                    Від {product.nextTierAtQty} {line.unit} буде дешевше
                  </p>
                )}
                {tooMany && (
                  <p className="text-[13px] text-danger">
                    На складі лише {product?.stock} {line.unit}
                  </p>
                )}
              </div>

              <input
                type="number"
                min={1}
                value={line.qty}
                onChange={(e) => setQty(line.productId, Number(e.target.value) || 1)}
                className="input qty-input"
                aria-label={`Кількість, ${line.title}`}
              />

              <div className="min-w-27 flex-1 text-right">
                {product ? (
                  <>
                    <p key={product.total} className="price-flash font-semibold tnum">
                      {formatMoney(product.total)}
                    </p>
                    <p className="text-xs text-neutral-600">
                      {formatMoney(product.unitPrice)} / {line.unit}
                    </p>
                  </>
                ) : (
                  <span className="text-[13px] text-neutral-600">рахуємо…</span>
                )}
              </div>

              <button type="button" onClick={() => remove(line.productId)} className="icon-btn-plain">
                <TrashIcon />
                Прибрати
              </button>
            </li>
          );
        })}
      </ul>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="font-heading text-[22px] font-extrabold">
          Разом: <span className="tnum">{priced ? formatMoney(total.toFixed(2)) : '—'}</span>
        </p>

        <Link
          href={overStock ? '#' : '/checkout'}
          aria-disabled={overStock}
          className={`btn btn-primary ${overStock ? 'pointer-events-none' : ''}`}
        >
          Оформити замовлення
        </Link>
      </div>

      <p className="mt-3 text-xs text-neutral-600">
        Остаточну суму рахує сервер під час оформлення — вона може відрізнятися, якщо
        прайс змінився.
      </p>
    </div>
  );
}
