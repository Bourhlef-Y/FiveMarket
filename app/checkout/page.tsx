"use client";

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/hooks/useCart';
import { toast } from '@/hooks/useToast';
import { 
  Package, 
  CreditCard, 
  CheckCircle,
  ArrowLeft,
  Download,
  User,
  Calendar,
  ShoppingCart,
  Trash2
} from 'lucide-react';

interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  framework: string;
  images?: string;
  resource_type?: string;
  author: {
    id: string;
    username: string;
  };
}

export default function CheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, profile, loading } = useAuth();
  const { items: cartItems, total: cartTotal, itemCount } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [cfxId, setCfxId] = useState('');

  const productId = searchParams.get('product');
  const isSingleProduct = !!productId;
  const [hasEscrowProducts, setHasEscrowProducts] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login?redirect=/checkout' + (productId ? `?product=${productId}` : ''));
      return;
    }

    if (isSingleProduct && productId) {
      loadSingleProduct();
    } else if (!isSingleProduct) {
      loadCartProducts();
    }
  }, [user, loading, productId, isSingleProduct]);

  // Détecter les ressources escrow quand les produits sont chargés
  useEffect(() => {
    console.log('=== DÉTECTION RESSOURCES ESCROW ===');
    console.log('Produits chargés:', products);
    console.log('Nombre de produits:', products.length);
    
    const hasEscrow = products.some(product => {
      console.log(`Produit: ${product.title}, resource_type: ${product.resource_type}`);
      return product.resource_type === 'escrow';
    });
    
    console.log('Ressources escrow détectées:', hasEscrow);
    setHasEscrowProducts(hasEscrow);
    console.log('hasEscrowProducts state:', hasEscrow);
    console.log('=====================================');
  }, [products]);

  const loadSingleProduct = async () => {
    try {
      setLoadingProducts(true);
      console.log('Chargement du produit avec ID:', productId);
      const response = await fetch(`/api/products/${productId}`);
      console.log('Réponse API produit:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Données produit reçues:', data);
        setProducts([data]);
      } else {
        const errorData = await response.json();
        console.error('Erreur API produit:', errorData);
        toast({
          title: 'Erreur',
          description: errorData.error || 'Produit non trouvé',
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
      setLoadingProducts(false);
    }
  };

  const loadCartProducts = async () => {
    try {
      setLoadingProducts(true);
      console.log('Chargement des produits du panier:', cartItems);
      
      if (cartItems.length === 0) {
        toast({
          title: 'Panier vide',
          description: 'Votre panier est vide',
          variant: 'destructive'
        });
        router.push('/cart');
        return;
      }

      // Charger les détails de chaque produit du panier
      const productPromises = cartItems.map(async (item) => {
        try {
          const response = await fetch(`/api/products/${item.resource_id}`);
          if (response.ok) {
            const product = await response.json();
            return { ...product, cartQuantity: item.quantity };
          }
          return null;
        } catch (error) {
          console.error(`Erreur chargement produit ${item.resource_id}:`, error);
          return null;
        }
      });

      const loadedProducts = (await Promise.all(productPromises)).filter(Boolean);
      console.log('Produits chargés:', loadedProducts);
      
      setProducts(loadedProducts);
      
      // Pas besoin de quantités, un seul exemplaire par produit
      
    } catch (error) {
      console.error('Erreur chargement produits panier:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les produits du panier',
        variant: 'destructive'
      });
    } finally {
      setLoadingProducts(false);
    }
  };

  const handlePurchase = async () => {
    if (products.length === 0) return;

    // Vérifier si CFX ID est requis
    if (hasEscrowProducts && !cfxId.trim()) {
      toast({
        title: 'CFX ID requis',
        description: 'Veuillez entrer votre CFX ID pour les ressources escrow',
        variant: 'destructive'
      });
      return;
    }

    try {
      setProcessing(true);
      
      if (isSingleProduct) {
        // Achat d'un seul produit
        const product = products[0];
        
        const response = await fetch('/api/orders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            productId: product.id,
            quantity: 1,
            cfxId: hasEscrowProducts ? cfxId : undefined
          })
        });

        const data = await response.json();

        if (response.ok) {
          toast({
            title: 'Commande confirmée !',
            description: 'Votre achat a été traité avec succès',
            variant: 'default'
          });
          router.push(`/orders/${data.order.id}`);
        } else {
          throw new Error(data.error || 'Erreur lors de la commande');
        }
      } else {
        // Achat de plusieurs produits (panier)
        const orders = [];
        
        // Créer toutes les commandes en parallèle
        const orderPromises = products.map(async (product) => {
          const response = await fetch('/api/orders', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              productId: product.id,
              quantity: 1,
              cfxId: hasEscrowProducts ? cfxId : undefined
            })
          });

          const data = await response.json();

          if (response.ok) {
            return data.order;
          } else {
            throw new Error(data.error || `Erreur lors de la commande de ${product.title}`);
          }
        });

        const orderResults = await Promise.all(orderPromises);
        orders.push(...orderResults);

        toast({
          title: 'Commandes confirmées !',
          description: `${orders.length} commande(s) ont été traitées avec succès`,
          variant: 'default'
        });
        
        // Rediriger vers la page de confirmation avec toutes les commandes
        if (orders.length > 0) {
          const orderIds = orders.map(order => order.id).join(',');
          router.push(`/orders/confirmation?orders=${orderIds}`);
        }
      }
    } catch (error) {
      console.error('Erreur commande:', error);
      toast({
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Impossible de traiter la commande',
        variant: 'destructive'
      });
    } finally {
      setProcessing(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(price);
  };

  if (loading || loadingProducts) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#FF7101]"></div>
          <p className="text-gray-400 text-sm">Chargement des produits...</p>
          {productId && (
            <p className="text-gray-500 text-xs">ID du produit: {productId}</p>
          )}
        </div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Aucun produit trouvé</h1>
          <Button onClick={() => router.push('/')}>
            Retour à l'accueil
          </Button>
        </div>
      </div>
    );
  }

  // Calculer le total (un seul exemplaire par produit)
  const total = products.reduce((sum, product) => {
    return sum + product.price;
  }, 0);

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
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
        <h1 className="text-3xl font-bold text-white">
          {isSingleProduct ? 'Finaliser votre commande' : 'Finaliser vos commandes'}
        </h1>
        <p className="text-gray-400 mt-2">
          {isSingleProduct ? 'Récapitulatif de votre achat' : `Récapitulatif de vos ${products.length} achat(s)`}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Récapitulatif des produits */}
        <Card className="bg-zinc-800/50 border-zinc-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center space-x-2">
              <Package className="w-5 h-5" />
              <span>Récapitulatif</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {products.map((product) => {
              return (
                <div key={product.id} className="border-b border-zinc-700 pb-4 last:border-b-0">
                  <div className="flex items-start space-x-4">
                    {product.images && (
                      <img 
                        src={product.images} 
                        alt={product.title}
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                    )}
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white">{product.title}</h3>
                      <p className="text-sm text-gray-400 mb-2 line-clamp-2">{product.description}</p>
                      <div className="flex items-center space-x-2 mb-2">
                        <Badge variant="outline" className="border-zinc-600 text-zinc-400">
                          {product.category}
                        </Badge>
                        <Badge variant="outline" className="border-zinc-600 text-zinc-400">
                          {product.framework}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-gray-400">
                        <User className="w-4 h-4" />
                        <span>Par {product.author.username}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <div className="text-right">
                      <div className="text-lg font-semibold text-[#FF7101]">
                        {formatPrice(product.price)}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            <div className="border-t border-zinc-700 pt-4">
              <div className="flex items-center justify-between text-xl font-bold">
                <span className="text-white">Total :</span>
                <span className="text-[#FF7101]">{formatPrice(total)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Formulaire CFX ID pour ressources escrow */}
        {console.log('Rendu - hasEscrowProducts:', hasEscrowProducts, 'products.length:', products.length)}
        {hasEscrowProducts && (
          <Card className="bg-zinc-800/50 border-zinc-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center space-x-2">
                <User className="w-5 h-5" />
                <span>Informations Escrow</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-orange-500/20 border border-orange-500/30 rounded-lg p-4">
                <div className="flex items-center space-x-2 text-orange-400">
                  <Package className="w-5 h-5" />
                  <span className="font-semibold">Ressources Escrow Détectées</span>
                </div>
                <p className="text-sm text-orange-300 mt-1">
                  Certaines ressources nécessitent votre CFX ID pour la livraison
                </p>
              </div>

              <div className="space-y-2">
                <label htmlFor="cfxId" className="text-sm font-medium text-white">
                  CFX ID *
                </label>
                <input
                  id="cfxId"
                  type="text"
                  value={cfxId}
                  onChange={(e) => setCfxId(e.target.value)}
                  placeholder="Votre CFX ID (ex: 123456789)"
                  className="w-full px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-lg text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
                <p className="text-xs text-zinc-400">
                  Votre CFX ID sera transmis aux vendeurs pour la livraison des ressources escrow
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Informations de paiement */}
        <Card className="bg-zinc-800/50 border-zinc-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center space-x-2">
              <CreditCard className="w-5 h-5" />
              <span>Paiement</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-4">
              <div className="flex items-center space-x-2 text-green-400">
                <CheckCircle className="w-5 h-5" />
                <span className="font-semibold">Mode Développement</span>
              </div>
              <p className="text-sm text-green-300 mt-1">
                Le paiement est automatiquement accepté en mode développement
              </p>
            </div>

            <div className="space-y-3">
              {products.map((product) => {
                return (
                  <div key={product.id} className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">{product.title}</span>
                    <span className="text-white">{formatPrice(product.price)}</span>
                  </div>
                );
              })}
              
              <div className="border-t border-zinc-700 pt-2">
                <div className="flex items-center justify-between text-lg font-bold">
                  <span className="text-white">Total à payer :</span>
                  <span className="text-[#FF7101]">{formatPrice(total)}</span>
                </div>
              </div>
            </div>

            <Button
              onClick={handlePurchase}
              disabled={processing}
              className="w-full bg-[#FF7101] hover:bg-[#FF7101]/90 text-white"
            >
              {processing ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                  <span>Traitement...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Download className="w-4 h-4" />
                  <span>
                    {isSingleProduct ? 'Confirmer l\'achat' : `Confirmer les ${products.length} achat(s)`}
                  </span>
                </div>
              )}
            </Button>

            <p className="text-xs text-gray-500 text-center">
              En cliquant sur "Confirmer l'achat", vous acceptez nos conditions d'utilisation
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
