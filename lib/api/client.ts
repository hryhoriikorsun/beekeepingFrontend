import createClient, { type Middleware } from 'openapi-fetch';
import type { paths } from './schema';
import { useAuthStore } from '@/lib/auth/store';

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

/// Kept so a 401 can be retried with a fresh token: by the time the response
/// comes back the original request body is already spent.
const pristine = new WeakMap<Request, Request>();

const auth: Middleware = {
  onRequest({ request }) {
    const token = useAuthStore.getState().accessToken;
    if (token) {
      request.headers.set('Authorization', `Bearer ${token}`);
    }
    pristine.set(request, request.clone());
    return request;
  },

  async onResponse({ request, response }) {
    // The refresh endpoint failing is the end of the session, not a reason
    // to try refreshing again.
    if (response.status !== 401 || request.url.endsWith('/auth/refresh')) {
      return response;
    }

    const token = await refreshAccessToken();
    const retry = pristine.get(request);
    if (!token || !retry) {
      return response;
    }

    retry.headers.set('Authorization', `Bearer ${token}`);
    return fetch(retry);
  },
};

export const api = createClient<paths>({ baseUrl: API_URL, credentials: 'include' });
api.use(auth);

let inFlight: Promise<string | null> | null = null;

/**
 * Silent renewal. The refresh token is an httpOnly cookie scoped to /auth,
 * so it is never readable here - the browser attaches it, we only get a new
 * access token back and keep it in memory.
 *
 * Concurrent 401s share one request: otherwise five parallel queries would
 * rotate the refresh token five times and invalidate each other.
 */
export function refreshAccessToken(): Promise<string | null> {
  inFlight ??= (async () => {
    try {
      const res = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!res.ok) {
        useAuthStore.getState().clear();
        return null;
      }

      const { accessToken } = (await res.json()) as { accessToken: string };
      useAuthStore.getState().setAccessToken(accessToken);
      return accessToken;
    } finally {
      inFlight = null;
    }
  })();

  return inFlight;
}
