'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { login, register } from '@/lib/auth/actions';

export function AuthForm({ mode }: { mode: 'login' | 'register' }) {
  const router = useRouter();
  const next = useSearchParams().get('next') ?? '/';
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isLogin = mode === 'login';

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    const form = new FormData(event.currentTarget);
    const email = String(form.get('email'));
    const password = String(form.get('password'));
    const name = String(form.get('name') ?? '').trim();

    try {
      await (isLogin ? login(email, password) : register(email, password, name || undefined));
      router.push(next);
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-sm">
      <h1 className="text-2xl font-semibold">{isLogin ? 'Вхід' : 'Реєстрація'}</h1>

      {!isLogin && (
        <label className="mt-6 block text-sm font-medium">
          Імʼя
          <input
            name="name"
            autoComplete="name"
            className="mt-1 w-full rounded border border-amber-300 px-3 py-2"
          />
        </label>
      )}

      <label className="mt-4 block text-sm font-medium">
        Email
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          className="mt-1 w-full rounded border border-amber-300 px-3 py-2"
        />
      </label>

      <label className="mt-4 block text-sm font-medium">
        Пароль
        <input
          name="password"
          type="password"
          required
          minLength={8}
          autoComplete={isLogin ? 'current-password' : 'new-password'}
          className="mt-1 w-full rounded border border-amber-300 px-3 py-2"
        />
        {!isLogin && <span className="text-xs font-normal text-stone-500">Мінімум 8 символів</span>}
      </label>

      {error && <p className="mt-4 rounded bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      <button
        type="submit"
        disabled={pending}
        className="mt-6 w-full rounded-lg bg-amber-500 px-4 py-3 font-medium text-white hover:bg-amber-600 disabled:bg-stone-300"
      >
        {pending ? 'Зачекайте…' : isLogin ? 'Увійти' : 'Зареєструватися'}
      </button>

      <p className="mt-4 text-center text-sm text-stone-600">
        {isLogin ? (
          <>
            Немає акаунта?{' '}
            <Link href="/register" className="text-amber-700 underline">
              Зареєструватися
            </Link>
          </>
        ) : (
          <>
            Вже маєте акаунт?{' '}
            <Link href="/login" className="text-amber-700 underline">
              Увійти
            </Link>
          </>
        )}
      </p>
    </form>
  );
}
