'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { API_URL, refreshAccessToken } from '@/lib/api/client';
import { useAuthStore } from '@/lib/auth/store';

function useSilentLogin(): void {
  const setUser = useAuthStore((s) => s.setUser);
  const clear = useAuthStore((s) => s.clear);

  useEffect(() => {
    let cancelled = false;

    // The access token is gone after a reload by design. If the httpOnly
    // refresh cookie is still valid, the session comes back before the user
    // notices anything.
    void (async () => {
      const token = await refreshAccessToken();
      if (cancelled) return;
      if (!token) {
        clear();
        return;
      }

      const res = await fetch(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!cancelled && res.ok) {
        setUser(await res.json());
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [setUser, clear]);
}

function Session({ children }: { children: React.ReactNode }) {
  useSilentLogin();
  return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Prices come from the server and change rarely; refetching on
            // every window focus would be noise, not freshness.
            staleTime: 60_000,
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <Session>{children}</Session>
    </QueryClientProvider>
  );
}
