// Types pour le système de panier (version simplifiée)
export interface CartItem {
  id: string;
  resource_id: string;
  resource_title: string;
  resource_thumbnail_url?: string;
  author_username?: string;
  quantity: number;
  price_at_time: number;
  subtotal: number;
}

export interface CartState {
  items: CartItem[];
  total: number;
  itemCount: number;
  isLoading: boolean;
}

export interface CartContextType {
  state: CartState;
  addToCart: (productId: string, productTitle: string, price: number, thumbnailUrl?: string, authorUsername?: string) => Promise<void>;
  removeFromCart: (productId: string) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
}
