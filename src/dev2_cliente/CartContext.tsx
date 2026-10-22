import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { CartItem } from '../../types';

const CART_STORAGE_KEY = '@domicilios:cart';

interface CartValue {
  items: CartItem[];
  storeId: string | null;
  subtotal: number;
  count: number;
  /** Agrega productos respetando: un carrito = un comercio, y el stock disponible. */
  addWithPrompt: (newItems: CartItem[]) => void;
  setQuantity: (productId: string, quantity: number) => void;
  clear: () => void;
}

const CartContext = createContext<CartValue | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  // Cargar carrito persistido al iniciar
  useEffect(() => {
    AsyncStorage.getItem(CART_STORAGE_KEY)
      .then((raw) => {
        if (raw) {
          try {
            const parsed = JSON.parse(raw) as CartItem[];
            // Validar que los productos tengan la estructura correcta
            if (Array.isArray(parsed)) setItems(parsed);
          } catch {
            // Ignorar datos corruptos
          }
        }
      })
      .finally(() => setHydrated(true));
  }, []);

  // Persistir cambios
  useEffect(() => {
    if (hydrated) {
      AsyncStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items)).catch(() => {});
    }
  }, [items, hydrated]);

  const addWithPrompt = useCallback(
    (newItems: CartItem[]) => {
      if (newItems.length === 0) return;

      const apply = (base: CartItem[]) => {
        let clamped = false;
        const next = [...base];
        for (const { product, quantity } of newItems) {
          const idx = next.findIndex((i) => i.product.id === product.id);
          const wanted = (idx >= 0 ? next[idx].quantity : 0) + quantity;
          const qty = Math.min(wanted, product.stock);
          if (qty < wanted) clamped = true;
          if (qty <= 0) continue;
          if (idx >= 0) next[idx] = { product, quantity: qty };
          else next.push({ product, quantity: qty });
        }
        setItems(next);
        if (clamped) Alert.alert('Stock limitado', 'Ajustamos algunas cantidades al stock disponible.');
      };

      const currentStore = items[0]?.product.store_id;
      if (currentStore && newItems.some((i) => i.product.store_id !== currentStore)) {
        Alert.alert('Carrito de otro comercio', 'Tu carrito tiene productos de otro comercio. ¿Vaciarlo y empezar uno nuevo?', [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Vaciar y agregar', onPress: () => apply([]) },
        ]);
        return;
      }
      apply(items);
    },
    [items]
  );

  const setQuantity = useCallback((productId: string, quantity: number) => {
    setItems((prev) =>
      quantity <= 0
        ? prev.filter((i) => i.product.id !== productId)
        : prev.map((i) => (i.product.id === productId ? { ...i, quantity: Math.min(quantity, i.product.stock) } : i))
    );
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const value = useMemo<CartValue>(
    () => ({
      items,
      storeId: items[0]?.product.store_id ?? null,
      subtotal: items.reduce((s, i) => s + i.product.price * i.quantity, 0),
      count: items.reduce((s, i) => s + i.quantity, 0),
      addWithPrompt,
      setQuantity,
      clear,
    }),
    [items, addWithPrompt, setQuantity, clear]
  );

  if (!hydrated) {
    return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
  }

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart debe usarse dentro de <CartProvider>');
  return ctx;
};
