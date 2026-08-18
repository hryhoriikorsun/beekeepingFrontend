'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { api } from '@/lib/api/client';
import { messageOf } from '@/lib/api/errors';
import { useCartStore } from '@/lib/cart/store';

export function CheckoutForm() {
  const router = useRouter();
  const lines = useCartStore((s) => s.lines);
  const clearCart = useCartStore((s) => s.clear);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (lines.length === 0) {
    return (
      <p className="text-stone-600">
        Кошик порожній.{' '}
        <Link href="/" className="text-amber-700 underline">
          До каталогу
        </Link>
      </p>
    );
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    const form = new FormData(event.currentTarget);

    // Only quantities travel. Prices are the server's business, and sending
    // them from here would be an invitation to forge them.
    const { data, error: apiError } = await api.POST('/orders', {
      body: {
        items: lines.map(({ productId, qty }) => ({ productId, qty })),
        customerName: String(form.get('customerName')),
        customerPhone: String(form.get('customerPhone')),
        city: String(form.get('city')),
        warehouse: String(form.get('warehouse')),
        comment: String(form.get('comment') ?? '') || undefined,
        paymentMethod: 'COD',
      },
    });

    setPending(false);

    if (apiError || !data) {
      setError(messageOf(apiError, 'Не вдалося оформити замовлення'));
      return;
    }

    clearCart();
    router.push(`/orders/${data.id}`);
  }

  return (
    <form onSubmit={onSubmit} className="max-w-lg">
      <h1 className="text-2xl font-semibold">Оформлення замовлення</h1>

      <label className="mt-6 block text-sm font-medium">
        Отримувач
        <input
          name="customerName"
          required
          maxLength={120}
          autoComplete="name"
          className="mt-1 w-full rounded border border-amber-300 px-3 py-2"
        />
      </label>

      <label className="mt-4 block text-sm font-medium">
        Телефон
        <input
          name="customerPhone"
          required
          placeholder="+380671234567"
          pattern="\+380[0-9]{9}"
          autoComplete="tel"
          className="mt-1 w-full rounded border border-amber-300 px-3 py-2"
        />
        <span className="text-xs font-normal text-stone-500">У форматі +380XXXXXXXXX</span>
      </label>

      <label className="mt-4 block text-sm font-medium">
        Місто
        <input
          name="city"
          required
          maxLength={120}
          className="mt-1 w-full rounded border border-amber-300 px-3 py-2"
        />
      </label>

      <label className="mt-4 block text-sm font-medium">
        Відділення Нової пошти
        <input
          name="warehouse"
          required
          maxLength={200}
          placeholder="Відділення №12"
          className="mt-1 w-full rounded border border-amber-300 px-3 py-2"
        />
      </label>

      <label className="mt-4 block text-sm font-medium">
        Коментар
        <textarea
          name="comment"
          rows={3}
          maxLength={500}
          className="mt-1 w-full rounded border border-amber-300 px-3 py-2"
        />
      </label>

      <p className="mt-6 rounded bg-amber-100 p-3 text-sm text-stone-700">
        Оплата при отриманні на відділенні Нової пошти.
      </p>

      {error && <p className="mt-4 rounded bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="mt-6 w-full rounded-lg bg-amber-500 px-4 py-3 font-medium text-white hover:bg-amber-600 disabled:bg-stone-300"
      >
        {pending ? 'Оформлюємо…' : 'Підтвердити замовлення'}
      </button>
    </form>
  );
}
