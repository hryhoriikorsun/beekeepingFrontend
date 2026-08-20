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
      <div className="card elev-sm py-8 text-center">
        <p className="mb-3 text-neutral-700">Кошик порожній.</p>
        <Link href="/" className="btn btn-secondary">
          До каталогу
        </Link>
      </div>
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
    <form onSubmit={onSubmit} className="card elev-lg flex max-w-[560px] flex-col gap-4">
      <h1>Оформлення замовлення</h1>

      <label className="field">
        <span className="field-label">Отримувач</span>
        <input name="customerName" required maxLength={120} autoComplete="name" className="input" />
      </label>

      <label className="field">
        <span className="field-label">Телефон</span>
        <input
          name="customerPhone"
          required
          placeholder="+380671234567"
          pattern="\+380[0-9]{9}"
          autoComplete="tel"
          className="input"
        />
        <span className="field-hint">У форматі +380XXXXXXXXX</span>
      </label>

      <label className="field">
        <span className="field-label">Місто</span>
        <input name="city" required maxLength={120} className="input" />
      </label>

      <label className="field">
        <span className="field-label">Відділення Нової пошти</span>
        <input
          name="warehouse"
          required
          maxLength={200}
          placeholder="Відділення №12"
          className="input"
        />
      </label>

      <label className="field">
        <span className="field-label">Коментар</span>
        <textarea name="comment" rows={3} maxLength={500} className="input" />
      </label>

      <p className="alert alert-info">Оплата при отриманні на відділенні Нової пошти.</p>

      {error && <p className="alert alert-danger">{error}</p>}

      <button type="submit" disabled={pending} className="btn btn-primary btn-block">
        {pending ? 'Оформлюємо…' : 'Підтвердити замовлення'}
      </button>
    </form>
  );
}
