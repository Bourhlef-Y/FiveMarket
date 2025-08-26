"use client";

import { ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/hooks/useCart';
import Link from 'next/link';

export default function CartIcon() {
  const { totalItems } = useCart();

  return (
    <Button asChild variant="ghost" size="sm" className="relative">
      <Link href="/cart">
        <ShoppingCart className="h-5 w-5" />
        
        {/* Badge avec le nombre d'items */}
        {totalItems > 0 && (
          <Badge 
            className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center bg-[#FF7101] hover:bg-[#FF7101] text-xs font-bold"
          >
            {totalItems > 99 ? '99+' : totalItems}
          </Badge>
        )}
      </Link>
    </Button>
  );
}
