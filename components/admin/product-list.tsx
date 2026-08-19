'use client';

import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { api } from '@/lib/api/client';
import { messageOf } from '@/lib/api/errors';
import { formatMoney } from '@/lib/format';

/// Ukrainian titles do not transliterate themselves, so the slug is typed by
/// hand - it is a URL that search engines will remember.
export function ProductList() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: products, isPending } = useQuery({
    queryKey: ['admin', 'products'],
    queryFn: async () => {
      const { data, error: apiError } = await api.GET('/products', {});
      if (apiError || !data) throw new Error('Не вдалося завантажити товари');
      return data;
    },
  });

  const create = useMutation({
    mutationFn: async (form: FormData) => {
      const { data, error: apiError } = await api.POST('/products', {
        body: {
          title: String(form.get('title')),
          slug: String(form.get('slug')),
          description: String(form.get('description') ?? '') || undefined,
          unit: String(form.get('unit') ?? 'л'),
          basePrice: Number(form.get('basePrice')),
          stock: Number(form.get('stock') ?? 0),
        },
      });
      if (apiError || !data) throw new Error(messageOf(apiError, 'Не вдалося створити товар'));
      return data;
    },
    onSuccess: () => {
      setOpen(false);
      setError(null);
      void queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
    },
    onError: (e: Error) => setError(e.message),
  });

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Товари</h1>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="rounded-lg bg-amber-500 px-4 py-2 font-medium text-white hover:bg-amber-600"
        >
          {open ? 'Згорнути' : 'Додати товар'}
        </button>
      </div>

      {open && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            create.mutate(new FormData(e.currentTarget));
          }}
          className="mb-6 grid gap-4 rounded-xl border border-amber-200 bg-white p-4 sm:grid-cols-2"
        >
          <label className="text-sm font-medium">
            Назва
            <input name="title" required className="mt-1 w-full rounded border border-amber-300 px-3 py-2" />
          </label>
          <label className="text-sm font-medium">
            Slug (адреса сторінки)
            <input
              name="slug"
              required
              pattern="[a-z0-9]+(-[a-z0-9]+)*"
              placeholder="med-lypovyi"
              className="mt-1 w-full rounded border border-amber-300 px-3 py-2"
            />
          </label>
          <label className="text-sm font-medium sm:col-span-2">
            Опис
            <textarea name="description" rows={2} className="mt-1 w-full rounded border border-amber-300 px-3 py-2" />
          </label>
          <label className="text-sm font-medium">
            Ціна, грн
            <input
              name="basePrice"
              type="number"
              step="0.01"
              min="0"
              required
              className="mt-1 w-full rounded border border-amber-300 px-3 py-2"
            />
          </label>
          <div className="grid grid-cols-2 gap-4">
            <label className="text-sm font-medium">
              Одиниця
              <input name="unit" defaultValue="л" className="mt-1 w-full rounded border border-amber-300 px-3 py-2" />
            </label>
            <label className="text-sm font-medium">
              Залишок
              <input
                name="stock"
                type="number"
                min="0"
                defaultValue={0}
                className="mt-1 w-full rounded border border-amber-300 px-3 py-2"
              />
            </label>
          </div>

          {error && <p className="rounded bg-red-50 p-3 text-sm text-red-700 sm:col-span-2">{error}</p>}

          <button
            type="submit"
            disabled={create.isPending}
            className="rounded-lg bg-amber-500 px-4 py-2 font-medium text-white hover:bg-amber-600 disabled:bg-stone-300 sm:col-span-2"
          >
            {create.isPending ? 'Зберігаємо…' : 'Створити'}
          </button>
        </form>
      )}

      {isPending ? (
        <p className="text-stone-500">Завантаження…</p>
      ) : (
        <ul className="divide-y divide-amber-200 rounded-xl border border-amber-200 bg-white">
          {products?.map((product) => (
            <li key={product.id}>
              <Link
                href={`/admin/products/${product.id}`}
                className="flex flex-wrap items-center justify-between gap-3 p-4 hover:bg-amber-50"
              >
                <div>
                  <p className="font-medium">{product.title}</p>
                  <p className="text-sm text-stone-500">
                    /{product.slug} · залишок {product.stock} {product.unit}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{formatMoney(product.basePrice)}</p>
                  <p className="text-sm text-stone-500">
                    {product.tiers?.length
                      ? `${product.tiers.length} порогів для користувача`
                      : 'порогів немає'}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
