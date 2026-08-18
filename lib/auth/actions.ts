import { api } from '@/lib/api/client';
import { messageOf } from '@/lib/api/errors';
import { useAuthStore } from './store';

export async function login(email: string, password: string): Promise<void> {
  const { data, error } = await api.POST('/auth/login', { body: { email, password } });
  if (error || !data) {
    throw new Error(messageOf(error, 'Не вдалося увійти'));
  }
  useAuthStore.getState().setSession(data.user, data.accessToken);
}

export async function register(email: string, password: string, name?: string): Promise<void> {
  const { data, error } = await api.POST('/auth/register', {
    body: { email, password, ...(name ? { name } : {}) },
  });
  if (error || !data) {
    throw new Error(messageOf(error, 'Не вдалося зареєструватися'));
  }
  useAuthStore.getState().setSession(data.user, data.accessToken);
}

export async function logout(): Promise<void> {
  // Clear locally even if the request fails: the token is in memory, and a
  // user who pressed "вийти" must end up logged out regardless.
  try {
    await api.POST('/auth/logout');
  } finally {
    useAuthStore.getState().clear();
  }
}
