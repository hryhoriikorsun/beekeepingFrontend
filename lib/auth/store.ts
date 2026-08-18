import { create } from 'zustand';
import type { components } from '@/lib/api/schema';

type User = components['schemas']['UserDto'];

interface AuthState {
  user: User | null;
  accessToken: string | null;
  /// 'unknown' until the first silent refresh answers, so the header does not
  /// flash "Увійти" at somebody who is already logged in.
  status: 'unknown' | 'authenticated' | 'guest';
  setSession: (user: User, accessToken: string) => void;
  setAccessToken: (accessToken: string) => void;
  setUser: (user: User) => void;
  clear: () => void;
}

/**
 * The access token lives here and nowhere else - never in localStorage.
 * A tab reload loses it on purpose; the httpOnly refresh cookie brings a new
 * one back. That is the whole point of the split.
 */
export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  status: 'unknown',
  setSession: (user, accessToken) => set({ user, accessToken, status: 'authenticated' }),
  setAccessToken: (accessToken) => set({ accessToken }),
  setUser: (user) => set({ user, status: 'authenticated' }),
  clear: () => set({ user: null, accessToken: null, status: 'guest' }),
}));
