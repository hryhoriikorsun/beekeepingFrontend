import type { Product } from './types';

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

/**
 * Server-side reads for pages that must be rendered for search engines.
 * No token is sent on purpose: the crawler is a guest, and a guest sees the
 * retail price. A logged-in buyer gets their own price re-fetched on the
 * client, over the same endpoint.
 */
export async function fetchProducts(qty = 1): Promise<Product[]> {
  const res = await fetch(`${API_URL}/products?qty=${qty}`, { next: { revalidate: 60 } });
  if (!res.ok) {
    throw new Error(`Каталог недоступний: ${res.status}`);
  }
  return res.json();
}

/**
 * Same read, but never fatal. Used where a failure must not take a build or
 * a whole page down with it: an unreachable API becomes an empty catalogue
 * that the next revalidation fixes, not a failed deploy.
 */
export async function fetchProductsSafe(qty = 1): Promise<Product[]> {
  try {
    return await fetchProducts(qty);
  } catch (error) {
    console.error('[catalogue]', error);
    return [];
  }
}

export async function fetchProduct(slug: string, qty = 1): Promise<Product | null> {
  const res = await fetch(`${API_URL}/products/${slug}?qty=${qty}`, { next: { revalidate: 60 } });
  if (res.status === 404) {
    return null;
  }
  if (!res.ok) {
    throw new Error(`Товар недоступний: ${res.status}`);
  }
  return res.json();
}
