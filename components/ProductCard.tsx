"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/useToast';
import { 
  Package, 
  ShoppingCart,
  Eye,
  Download,
  Calendar,
  User
} from 'lucide-react';

interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  framework: string;
  images?: string;
  download_count: number;
  created_at: string;
  author: {
    id: string;
    username: string;
  };
}

interface ProductCardProps {
  product: Product;
  showBuyButton?: boolean;
  onView?: (product: Product) => void;
}

export default function ProductCard({ product, showBuyButton = true, onView }: ProductCardProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleBuy = async () => {
    if (!user) {
      toast({
        title: 'Connexion requise',
        description: 'Vous devez être connecté pour acheter un produit',
        variant: 'destructive'
      });
      router.push('/auth/login?redirect=/checkout?product=' + product.id);
      return;
    }

    // Vérifier que l'utilisateur n'achète pas son propre produit
    if (user.id === product.author.id) {
      toast({
        title: 'Action impossible',
        description: 'Vous ne pouvez pas acheter votre propre produit',
        variant: 'destructive'
      });
      return;
    }

    try {
      setIsLoading(true);
      router.push(`/checkout?product=${product.id}`);
    } catch (error) {
      console.error('Erreur navigation checkout:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de rediriger vers le checkout',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleView = () => {
    if (onView) {
      onView(product);
    } else {
      // Navigation par défaut vers une page de détail du produit
      router.push(`/products/${product.id}`);
    }
  };

  return (
    <Card className="bg-zinc-800/50 border-zinc-700 hover:border-zinc-600 transition-colors">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg text-white line-clamp-2 mb-2">
              {product.title}
            </CardTitle>
            <p className="text-sm text-gray-400 line-clamp-2">
              {product.description}
            </p>
          </div>
          {product.images && (
            <img 
              src={product.images} 
              alt={product.title}
              className="w-16 h-16 object-cover rounded-lg ml-4"
            />
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Tags */}
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="border-zinc-600 text-zinc-400">
            {product.category}
          </Badge>
          <Badge variant="outline" className="border-zinc-600 text-zinc-400">
            {product.framework}
          </Badge>
        </div>

        {/* Informations du produit */}
        <div className="space-y-2 text-sm text-gray-400">
          <div className="flex items-center space-x-2">
            <User className="w-4 h-4" />
            <span>Par {product.author.username}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Download className="w-4 h-4" />
            <span>{product.download_count} téléchargements</span>
          </div>
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4" />
            <span>Créé le {formatDate(product.created_at)}</span>
          </div>
        </div>

        {/* Prix et actions */}
        <div className="flex items-center justify-between pt-2 border-t border-zinc-700">
          <div className="text-2xl font-bold text-[#FF7101]">
            {formatPrice(product.price)}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleView}
              className="border-zinc-600 text-zinc-300 hover:bg-zinc-700"
            >
              <Eye className="w-4 h-4 mr-1" />
              Voir
            </Button>
            {showBuyButton && (
              <Button
                onClick={handleBuy}
                disabled={isLoading || user?.id === product.author.id}
                className="bg-[#FF7101] hover:bg-[#FF7101]/90 text-white"
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                ) : (
                  <>
                    <ShoppingCart className="w-4 h-4 mr-1" />
                    Acheter
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
