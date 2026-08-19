'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuthStore } from '@/lib/auth/store';

/// Hides the screens. The API refuses the same calls to anyone but an admin,
/// which is where the actual protection lives.
export function RequireAdmin({ children }: { children: React.ReactNode }) {
  const { user, status } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (status === 'guest') {
      router.replace('/login?next=%2Fadmin');
    }
  }, [status, router]);

  if (status !== 'authenticated') {
    return <p className="text-stone-500">Завантаження…</p>;
  }
  if (user?.role !== 'ADMIN') {
    return <p className="rounded bg-red-50 p-3 text-red-700">Цей розділ лише для адміністратора.</p>;
  }
  return <>{children}</>;
}
