"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Check, Loader2 } from 'lucide-react';
import { useCart } from '@/hooks/useCart';

interface AddToCartButtonProps {
  productId: string;
  price: number;
  className?: string;
}

export default function AddToCartButton({
  productId,
  price,
  className = ''
}: AddToCartButtonProps) {
  const { addToCart, loading } = useCart();
  const [justAdded, setJustAdded] = useState(false);

  const handleAddToCart = async () => {
    try {
      const success = await addToCart(productId, price);
      if (success) {
        setJustAdded(true);
        setTimeout(() => setJustAdded(false), 2000);
      }
    } catch {
      // On ignore l'erreur, le toast est déjà affiché côté contexte
      setJustAdded(false); // S'assurer que l'état n'est jamais activé en cas d'erreur
    }
  };

  // Si le produit est gratuit
  if (price === 0) {
    return (
      <Button
        onClick={handleAddToCart}
        disabled={loading}
        className={`${className} ${justAdded ? 'bg-green-600 hover:bg-green-600' : 'bg-blue-600 hover:bg-blue-700'}`}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin mr-2" />
        ) : justAdded ? (
          <Check className="h-4 w-4 mr-2" />
        ) : (
          <ShoppingCart className="h-4 w-4 mr-2" />
        )}
        {justAdded ? 'Ajouté !' : 'Ajouter (Gratuit)'}
      </Button>
    );
  }

  return (
    <Button
      onClick={handleAddToCart}
      disabled={loading}
      className={`${className} ${justAdded ? 'bg-green-600 hover:bg-green-600' : 'bg-[#FF7101] hover:bg-[#FF7101]/90'}`}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
      ) : justAdded ? (
        <Check className="h-4 w-4 mr-2" />
      ) : (
        <ShoppingCart className="h-4 w-4 mr-2" />
      )}
      {justAdded ? 'Ajouté !' : `Ajouter ${price}€`}
    </Button>
  );
}