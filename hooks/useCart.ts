import { useCart as useCartContext } from '@/contexts/CartContext';

// Hook personnalisé qui expose le context du panier
export function useCart() {
  const context = useCartContext();
  
  // Propriétés calculées utiles
  const hasItems = context.items.length > 0;
  const isEmptyCart = !hasItems;
  const totalItems = context.itemCount;

  return {
    ...context,
    hasItems,
    isEmptyCart,
    totalItems
  };
}