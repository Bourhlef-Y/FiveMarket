"use client";

import { createContext, useContext, useReducer, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from './AuthContext';
import { useToast } from '@/hooks/useToast';

interface CartItem {
  id: string;
  resource_id: string;
  resource_title: string;
  resource_thumbnail?: string;
  author_username?: string;
  quantity: number;
  price_at_time: number;
  subtotal: number;
}

interface CartState {
  items: CartItem[];
  loading: boolean;
  itemCount: number;
  total: number;
}

type CartAction =
  | { type: 'SET_CART'; payload: CartItem[] }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'CLEAR_CART' };

const initialState: CartState = {
  items: [],
  loading: false,
  itemCount: 0,
  total: 0
};

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'SET_CART':
      const newTotal = action.payload.reduce((sum, item) => sum + item.subtotal, 0);
      return {
        ...state,
        items: action.payload,
        loading: false,
        itemCount: action.payload.reduce((total, item) => total + item.quantity, 0),
        total: newTotal
      };
    
    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload
      };
    
    case 'CLEAR_CART':
      return {
        ...state,
        items: [],
        loading: false,
        itemCount: 0,
        total: 0
      };
      
    default:
      return state;
  }
}

// Context
const CartContext = createContext<CartContextType | undefined>(undefined);

// Provider
export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, initialState);
  const { user } = useAuth();
  const { toast } = useToast();
  const loadingRef = useRef(false);

  // Charger le panier une seule fois au chargement et quand l'utilisateur change
  useEffect(() => {
    if (user && !loadingRef.current) {
      loadingRef.current = true;
      loadCart();
    } else if (!user) {
      dispatch({ type: 'CLEAR_CART' });
    }
  }, [user]);

  // Charger le panier depuis la BDD
  const loadCart = async () => {
    if (!user) return;
    
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      

      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch('/api/cart', {
        credentials: 'include',
        headers: {
          'Authorization': `Bearer ${session?.access_token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        dispatch({ type: 'SET_CART', payload: data.items || [] });
      } else {
        console.error('Erreur chargement panier');
        dispatch({ type: 'SET_CART', payload: [] });
      }
    } catch (error) {
      console.error('Erreur chargement panier');
      dispatch({ type: 'SET_CART', payload: [] });
    } finally {
      loadingRef.current = false;
    }
  };

  // Ajouter un produit au panier
  const addToCart = useCallback(async (
    resource_id: string,
    price: number,
    quantity: number = 1
  ) => {
    if (!user) {
      toast({
        title: "Non connecté",
        description: "Veuillez vous connecter pour ajouter au panier",
        variant: "destructive"
      });
      return false;
    }

    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const response = await fetch('/api/cart/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ resource_id, price, quantity })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erreur ajout au panier');
      }

      // Recharger le panier après l'ajout
      await loadCart();
      
      toast({
        title: "Ajouté au panier",
        description: "Le produit a été ajouté à votre panier",
        variant: "success"
      });
      
      return true;
    } catch (error) {
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Erreur lors de l'ajout au panier",
        variant: "destructive"
      });
      return false;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [user, toast]);

  // Supprimer un produit du panier
  const removeFromCart = useCallback(async (itemId: string) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const response = await fetch(`/api/cart/remove?itemId=${itemId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Erreur suppression du panier');
      }

      // Recharger le panier après la suppression
      await loadCart();
      
      toast({
        title: "Produit retiré",
        description: "Le produit a été retiré de votre panier",
        variant: "success"
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de retirer le produit du panier",
        variant: "destructive"
      });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [toast]);

  // Vider le panier
  const clearCart = useCallback(async () => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const response = await fetch('/api/cart/clear', {
        method: 'DELETE',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Erreur vidage du panier');
      }

      dispatch({ type: 'CLEAR_CART' });
      
      toast({
        title: "Panier vidé",
        description: "Votre panier a été vidé avec succès",
        variant: "success"
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de vider le panier",
        variant: "destructive"
      });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, [toast]);

  return (
    <CartContext.Provider value={{
      items: state.items,
      loading: state.loading,
      itemCount: state.itemCount,
      total: state.total,
      addToCart,
      removeFromCart,
      clearCart,
      loadCart
    }}>
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

interface CartContextType {
  items: CartItem[];
  loading: boolean;
  itemCount: number;
  total: number;
  addToCart: (resource_id: string, price: number, quantity?: number) => Promise<boolean>;
  removeFromCart: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  loadCart: () => Promise<void>;
}