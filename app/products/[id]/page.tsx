"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/useToast';
import { 
  Package, 
  ShoppingCart,
  Download,
  ArrowLeft,
  Calendar,
  User,
  Eye
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

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [loadingProduct, setLoadingProduct] = useState(true);

  const productId = params.id as string;

  useEffect(() => {
    if (productId) {
      loadProduct();
    }
  }, [productId]);

  const loadProduct = async () => {
    try {
      setLoadingProduct(true);
      const response = await fetch(`/api/products/${productId}`);
      if (response.ok) {
        const data = await response.json();
        setProduct(data);
      } else {
        toast({
          title: 'Erreur',
          description: 'Produit non trouvé',
          variant: 'destructive'
        });
        router.push('/');
      }
    } catch (error) {
      console.error('Erreur chargement produit:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger le produit',
        variant: 'destructive'
      });
    } finally {
      setLoadingProduct(false);
    }
  };

  const handleBuy = () => {
    if (!user) {
      toast({
        title: 'Connexion requise',
        description: 'Vous devez être connecté pour acheter un produit',
        variant: 'destructive'
      });
      router.push('/auth/login?redirect=/checkout?product=' + productId);
      return;
    }

    // Vérifier que l'utilisateur n'achète pas son propre produit
    if (user.id === product?.author.id) {
      toast({
        title: 'Action impossible',
        description: 'Vous ne pouvez pas acheter votre propre produit',
        variant: 'destructive'
      });
      return;
    }

    router.push(`/checkout?product=${productId}`);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading || loadingProduct) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#FF7101]"></div>
          <p className="text-gray-400 text-sm">Chargement du produit...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Produit non trouvé</h1>
          <Button onClick={() => router.push('/')}>
            Retour à l'accueil
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* En-tête */}
      <div className="mb-8">
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.back()}
          className="mb-4 border-zinc-600 text-zinc-300 hover:bg-zinc-700"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Informations principales */}
        <div className="lg:col-span-2 space-y-6">
          {/* Image et titre */}
          <Card className="bg-zinc-800/50 border-zinc-700">
            <CardContent className="p-6">
              {product.images && (
                <img 
                  src={product.images} 
                  alt={product.title}
                  className="w-full h-64 object-cover rounded-lg mb-6"
                />
              )}
              <h1 className="text-3xl font-bold text-white mb-4">{product.title}</h1>
              <p className="text-gray-300 text-lg leading-relaxed">{product.description}</p>
            </CardContent>
          </Card>

          {/* Détails du produit */}
          <Card className="bg-zinc-800/50 border-zinc-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center space-x-2">
                <Package className="w-5 h-5" />
                <span>Détails du produit</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <User className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-400">Auteur</p>
                    <p className="text-white font-medium">{product.author.username}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Download className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-400">Téléchargements</p>
                    <p className="text-white font-medium">{product.download_count}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-400">Date de création</p>
                    <p className="text-white font-medium">{formatDate(product.created_at)}</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="border-zinc-600 text-zinc-400">
                  {product.category}
                </Badge>
                <Badge variant="outline" className="border-zinc-600 text-zinc-400">
                  {product.framework}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Panneau d'achat */}
        <div className="space-y-6">
          <Card className="bg-zinc-800/50 border-zinc-700 sticky top-8">
            <CardHeader>
              <CardTitle className="text-white flex items-center space-x-2">
                <ShoppingCart className="w-5 h-5" />
                <span>Achat</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <div className="text-4xl font-bold text-[#FF7101] mb-2">
                  {formatPrice(product.price)}
                </div>
                <p className="text-gray-400 text-sm">Prix unique</p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Prix :</span>
                  <span className="text-white">{formatPrice(product.price)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">TVA :</span>
                  <span className="text-white">Incluse</span>
                </div>
                <div className="border-t border-zinc-700 pt-2">
                  <div className="flex items-center justify-between text-lg font-bold">
                    <span className="text-white">Total :</span>
                    <span className="text-[#FF7101]">{formatPrice(product.price)}</span>
                  </div>
                </div>
              </div>

              <Button
                onClick={handleBuy}
                disabled={loading || user?.id === product.author.id}
                className="w-full bg-[#FF7101] hover:bg-[#FF7101]/90 text-white py-3 text-lg"
              >
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
                    <span>Chargement...</span>
                  </div>
                ) : user?.id === product.author.id ? (
                  <div className="flex items-center space-x-2">
                    <Eye className="w-5 h-5" />
                    <span>Votre produit</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <ShoppingCart className="w-5 h-5" />
                    <span>Acheter maintenant</span>
                  </div>
                )}
              </Button>

              <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-3">
                <p className="text-sm text-blue-300 text-center">
                  <strong>Mode Développement :</strong> Le paiement est automatiquement accepté
                </p>
              </div>

              <div className="text-xs text-gray-500 text-center space-y-1">
                <p>• Accès immédiat après achat</p>
                <p>• Support inclus</p>
                <p>• Mises à jour gratuites</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
