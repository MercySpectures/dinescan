import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface CartItem {
  key: string; // usually itemId|note
  itemId: string;
  name: string;
  price: number;
  qty: number;
  note: string;
}

interface CartState {
  cart: CartItem[];
  notesByItemId: Record<string, string>;
  tableCode: string;
  sessionId: string;
  
  // Actions
  setTableCode: (code: string) => void;
  setSessionId: (id: string) => void;
  setNote: (itemId: string, note: string) => void;
  addToCart: (itemId: string, name: string, price: number) => void;
  updateQty: (key: string, delta: number) => void;
  clearCart: () => void;
  purgeStaleItems: (validItemIds: string[]) => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      cart: [],
      notesByItemId: {},
      tableCode: "",
      sessionId: "",

      setTableCode: (code: string) => set({ tableCode: code }),
      setSessionId: (id: string) => set({ sessionId: id }),
      setNote: (itemId: string, note: string) =>
        set((state) => ({
          notesByItemId: { ...state.notesByItemId, [itemId]: note },
        })),

      addToCart: (itemId: string, name: string, price: number) => {
        set((state) => {
          const note = (state.notesByItemId[itemId] ?? "").trim();
          const key = `${itemId}|${note}`;
          const existing = state.cart.find((row) => row.key === key);

          if (existing) {
            return {
              cart: state.cart.map((row) =>
                row.key === key ? { ...row, qty: row.qty + 1 } : row
              ),
            };
          }

          return {
            cart: [
              ...state.cart,
              {
                key,
                itemId,
                name,
                price,
                qty: 1,
                note,
              },
            ],
          };
        });
      },

      updateQty: (key: string, delta: number) => {
        set((state) => ({
          cart: state.cart
            .map((row) => (row.key === key ? { ...row, qty: row.qty + delta } : row))
            .filter((row) => row.qty > 0),
        }));
      },

      clearCart: () => set({ cart: [], notesByItemId: {} }),

      purgeStaleItems: (validIds: string[]) => {
        set((state) => {
          const newCart = state.cart.filter((row) => validIds.includes(row.itemId));
          if (newCart.length === state.cart.length) return state;
          return { cart: newCart };
        });
      },
    }),
    {
      name: "dinescan-cart-storage", // name of the item in the storage (must be unique)
      storage: createJSONStorage(() => localStorage), // (optional) by default, 'localStorage' is used
    }
  )
);
