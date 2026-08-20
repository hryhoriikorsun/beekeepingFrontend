'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { login, register } from '@/lib/auth/actions';
import { ArrowLeftIcon, HiveIcon } from './icons';

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
    <div className="mx-auto max-w-[820px]">
      <Link href="/" className="back-btn mb-4">
        <ArrowLeftIcon />
        До каталогу
      </Link>

      <div className="split-grid items-stretch">
        <aside className="login-side">
          <div className="blob blob-1" style={{ top: -90, right: -70 }} />
          <HiveIcon size={40} className="relative" />
          <h2 className="relative">{isLogin ? 'З поверненням' : 'Приєднуйтесь'}</h2>
          <p className="relative m-0 opacity-90">
            {isLogin
              ? 'Увійдіть, щоб бачити свої замовлення та гуртові ціни на мед.'
              : 'Реєстрація займе хвилину. Далі — замовлення і гуртові ціни для постійних покупців.'}
          </p>
        </aside>

        <form onSubmit={onSubmit} className="card elev-lg flex flex-col justify-center gap-4">
          <h1>{isLogin ? 'Вхід' : 'Реєстрація'}</h1>

          {!isLogin && (
            <label className="field">
              <span className="field-label">Імʼя</span>
              <input name="name" autoComplete="name" className="input" />
            </label>
          )}

          <label className="field">
            <span className="field-label">Email</span>
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="customer@beekeeping.local"
              className="input"
            />
          </label>

          <label className="field">
            <span className="field-label">Пароль</span>
            <input
              name="password"
              type="password"
              required
              minLength={8}
              autoComplete={isLogin ? 'current-password' : 'new-password'}
              className="input"
            />
            {!isLogin && <span className="field-hint">Мінімум 8 символів</span>}
          </label>

          {error && <p className="alert alert-danger">{error}</p>}

          <button type="submit" disabled={pending} className="btn btn-primary btn-block">
            {pending ? 'Зачекайте…' : isLogin ? 'Увійти' : 'Зареєструватися'}
          </button>

          <p className="text-center text-[13px] text-neutral-700">
            {isLogin ? (
              <>
                Немає акаунта? <Link href="/register">Зареєструватися</Link>
              </>
            ) : (
              <>
                Вже маєте акаунт? <Link href="/login">Увійти</Link>
              </>
            )}
          </p>
        </form>
      </div>
    </div>
  );
}
