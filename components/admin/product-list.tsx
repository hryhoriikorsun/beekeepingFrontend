'use client';

import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { api } from '@/lib/api/client';
import { messageOf } from '@/lib/api/errors';
import { formatMoney } from '@/lib/format';
import { ImagePicker } from './image-picker';

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
          imageUrl: String(form.get('imageUrl') ?? '') || undefined,
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
        <h1 >Товари</h1>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="btn btn-primary"
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
          className="mb-6 grid gap-4 card elev-sm p-4 sm:grid-cols-2"
        >
          <label className="text-sm font-medium">
            Назва
            <input name="title" required className="input mt-1" />
          </label>
          <label className="text-sm font-medium">
            Slug (адреса сторінки)
            <input
              name="slug"
              required
              pattern="[a-z0-9]+(-[a-z0-9]+)*"
              placeholder="med-lypovyi"
              className="input mt-1"
            />
          </label>
          <label className="text-sm font-medium sm:col-span-2">
            Опис
            <textarea name="description" rows={2} className="input mt-1" />
          </label>
          <label className="text-sm font-medium">
            Ціна, грн
            <input
              name="basePrice"
              type="number"
              step="0.01"
              min="0"
              required
              className="input mt-1"
            />
          </label>
          <div className="grid grid-cols-2 gap-4">
            <label className="text-sm font-medium">
              Одиниця
              <input name="unit" defaultValue="л" className="input mt-1" />
            </label>
            <label className="text-sm font-medium">
              Залишок
              <input
                name="stock"
                type="number"
                min="0"
                defaultValue={0}
                className="input mt-1"
              />
            </label>
          </div>

          <ImagePicker name="imageUrl" />

          {error && <p className="alert alert-danger sm:col-span-2">{error}</p>}

          <button
            type="submit"
            disabled={create.isPending}
            className="btn btn-primary sm:col-span-2"
          >
            {create.isPending ? 'Зберігаємо…' : 'Створити'}
          </button>
        </form>
      )}

      {isPending ? (
        <p className="text-neutral-600">Завантаження…</p>
      ) : (
        <ul className="divide-y divide-neutral-300 card elev-sm">
          {products?.map((product) => (
            <li key={product.id}>
              <Link
                href={`/admin/products/${product.id}`}
                className="flex flex-wrap items-center justify-between gap-3 p-4 hover:bg-accent-100"
              >
                <div>
                  <p className="font-medium">{product.title}</p>
                  <p className="text-sm text-neutral-600">
                    /{product.slug} · залишок {product.stock} {product.unit}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{formatMoney(product.basePrice)}</p>
                  <p className="text-sm text-neutral-600">
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
