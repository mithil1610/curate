import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  restaurantId: string;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (itemId: string) => void;
  clearCart: () => void;
  totalPrice: number;
  restaurantId: string | null;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  const addToCart = (newItem: CartItem) => {
    setItems(currentItems => {
      // If adding from a different restaurant, clear cart first or block it. For simplicity, clear it.
      if (currentItems.length > 0 && currentItems[0].restaurantId !== newItem.restaurantId) {
         return [newItem];
      }

      const existingIndex = currentItems.findIndex(i => i.name === newItem.name);
      if (existingIndex > -1) {
        const updated = [...currentItems];
        updated[existingIndex].quantity += newItem.quantity;
        return updated;
      }
      return [...currentItems, newItem];
    });
  };

  const removeFromCart = (itemId: string) => {
    setItems(current => current.filter(i => i.id !== itemId));
  };

  const clearCart = () => setItems([]);

  const totalPrice = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const restaurantId = items.length > 0 ? items[0].restaurantId : null;

  return (
    <CartContext.Provider value={{ items, addToCart, removeFromCart, clearCart, totalPrice, restaurantId }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
