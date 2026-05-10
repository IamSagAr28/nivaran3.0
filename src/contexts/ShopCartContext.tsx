import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface CartItem {
  // `id` is the cart line id (unique per product + selected variant)
  id: string;
  // `productId` is the underlying product id
  productId: string;
  title: string;
  price: number;
  image: string;
  quantity: number;
  category?: string;
  material?: string;
  variantColor?: string;
}

interface ShopCartContextType {
  items: CartItem[];
  addToCart: (item: Omit<CartItem, 'quantity' | 'id'> & { quantity?: number }) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, qty: number) => void;
  clearCart: () => void;
  totalItems: number;
  subtotal: number;
}

const ShopCartContext = createContext<ShopCartContextType | null>(null);

const STORAGE_KEY = 'nivara_shop_cart';

export function ShopCartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      const parsed = saved ? JSON.parse(saved) : [];
      if (!Array.isArray(parsed)) return [];

      // Back-compat: older carts only had `id` as product id.
      return parsed
        .map((raw: any) => {
          const productId = String(raw.productId ?? raw.id ?? '');
          const variantColor = raw.variantColor ? String(raw.variantColor) : undefined;
          const lineId = variantColor ? `${productId}::${variantColor}` : productId;
          return {
            ...raw,
            id: String(raw.id ?? lineId),
            productId,
            variantColor,
          } as CartItem;
        })
        .filter((i: CartItem) => Boolean(i.id) && Boolean(i.productId));
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addToCart = (item: Omit<CartItem, 'quantity' | 'id'> & { quantity?: number; id?: string }) => {
    setItems(prev => {
      const productId = String((item as any).productId ?? (item as any).id ?? '');
      const variantColor = (item as any).variantColor ? String((item as any).variantColor) : undefined;
      const lineId = variantColor ? `${productId}::${variantColor}` : productId;

      const existing = prev.find(i => i.id === lineId);
      if (existing) {
        return prev.map(i =>
          i.id === lineId
            ? { ...i, quantity: i.quantity + (item.quantity || 1) }
            : i
        );
      }

      const nextItem: CartItem = {
        ...(item as any),
        id: lineId,
        productId,
        variantColor,
        quantity: item.quantity || 1,
      };
      return [...prev, nextItem];
    });
  };

  const removeFromCart = (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
  };

  const updateQuantity = (id: string, qty: number) => {
    if (qty <= 0) {
      removeFromCart(id);
      return;
    }
    setItems(prev => prev.map(i => i.id === id ? { ...i, quantity: qty } : i));
  };

  const clearCart = () => setItems([]);

  const totalItems = items.reduce((s, i) => s + i.quantity, 0);
  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);

  return (
    <ShopCartContext.Provider value={{
      items, addToCart, removeFromCart, updateQuantity, clearCart, totalItems, subtotal
    }}>
      {children}
    </ShopCartContext.Provider>
  );
}

export function useShopCart() {
  const ctx = useContext(ShopCartContext);
  if (!ctx) throw new Error('useShopCart must be used within ShopCartProvider');
  return ctx;
}
