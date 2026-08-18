import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartLine {
  productId: string;
  slug: string;
  title: string;
  unit: string;
  qty: number;
}

interface CartState {
  lines: CartLine[];
  add: (line: CartLine) => void;
  setQty: (productId: string, qty: number) => void;
  remove: (productId: string) => void;
  clear: () => void;
  count: () => number;
}

/**
 * The cart stores quantities, never prices. Prices depend on the buyer role
 * and on the total quantity, and only the server may decide them - a cached
 * price in localStorage would be a stale price at checkout.
 */
export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      lines: [],

      add: (line) =>
        set(({ lines }) => {
          const existing = lines.find((l) => l.productId === line.productId);
          return existing
            ? {
                lines: lines.map((l) =>
                  l.productId === line.productId ? { ...l, qty: l.qty + line.qty } : l,
                ),
              }
            : { lines: [...lines, line] };
        }),

      setQty: (productId, qty) =>
        set(({ lines }) =>
          qty < 1
            ? { lines: lines.filter((l) => l.productId !== productId) }
            : { lines: lines.map((l) => (l.productId === productId ? { ...l, qty } : l)) },
        ),

      remove: (productId) =>
        set(({ lines }) => ({ lines: lines.filter((l) => l.productId !== productId) })),

      clear: () => set({ lines: [] }),
      count: () => get().lines.reduce((sum, l) => sum + l.qty, 0),
    }),
    { name: 'beekeeping-cart' },
  ),
);
