"use client";

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Trash2, Plus, Minus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useCart } from '@/hooks/useCart';
import { CartItem as CartItemType } from '@/lib/cart-types';

interface CartItemProps {
  item: CartItemType;
}

export default function CartItem({ item }: CartItemProps) {
  const { updateQuantity, removeFromCart, loading } = useCart();
  const [isUpdating, setIsUpdating] = useState(false);

  const handleQuantityChange = async (newQuantity: number) => {
    if (newQuantity < 1) return;
    
    setIsUpdating(true);
    try {
      await updateQuantity(item.id, newQuantity);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRemove = async () => {
    setIsUpdating(true);
    try {
      await removeFromCart(item.id);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Card className="bg-zinc-800/50 border-zinc-700">
      <CardContent className="p-4">
        <div className="flex gap-4">
          {/* Image du produit */}
          <div className="relative h-20 w-20 flex-shrink-0">
            <Image
              src={item.resource_thumbnail_url || '/placeholder.svg'}
              alt={item.resource_title}
              fill
              className="object-cover rounded"
            />
          </div>

          {/* Informations du produit */}
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start mb-2">
              <div>
                <Link
                  href={`/product/${item.resource_id}`}
                  className="text-white font-medium hover:text-[#FF7101] transition-colors"
                >
                  <h3 className="line-clamp-2">{item.resource_title}</h3>
                </Link>
                
                {item.author_username && (
                  <p className="text-sm text-zinc-400 mt-1">
                    par {item.author_username}
                  </p>
                )}
              </div>

              {/* Bouton supprimer */}
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRemove}
                disabled={isUpdating || loading}
                className="text-zinc-400 hover:text-red-400 p-1"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            {/* Prix uniquement, sans quantité */}
            <div className="flex items-center justify-between">
              <div></div>
              {/* Prix */}
              <div className="text-right">
                <p className="text-lg font-bold text-[#FF7101]">
                  {item.price_at_time === 0 ? 'Gratuit' : `${item.subtotal.toFixed(2)}€`}
                </p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
