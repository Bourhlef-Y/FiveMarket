'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Download, ArrowLeft, Package } from 'lucide-react';
import { toast } from 'sonner';

interface Product {
  id: string;
  title: string;
  price: number;
  images?: string[];
  resource_type?: string;
}

interface Order {
  id: string;
  amount: number;
  status: string;
  paid_at: string;
  created_at: string;
  product: Product;
}


export default function OrderConfirmation() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const orderIds = searchParams.get('orders');
    if (orderIds) {
      loadOrders(orderIds.split(','));
    } else {
      router.push('/');
    }
  }, [searchParams, router]);

  const loadOrders = async (orderIds: string[]) => {
    try {
      setLoading(true);
      const orderPromises = orderIds.map(id => 
        fetch(`/api/orders/${id}`).then(res => res.json())
      );
      
      const orderResults = await Promise.all(orderPromises);
      const validOrders = orderResults.filter(result => !result.error);
      
      console.log('Commandes chargées:', validOrders.map(order => ({
        id: order.id,
        product_title: order.product?.title,
        resource_type: order.product?.resource_type
      })));
      
      setOrders(validOrders);

    } catch (error) {
      console.error('Erreur lors du chargement des commandes:', error);
      toast.error('Erreur lors du chargement des commandes');
    } finally {
      setLoading(false);
    }
  };


  const handleDownload = async (orderId: string, productId: string) => {
    try {
      const response = await fetch(`/api/account/download/${orderId}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `resource-${productId}.zip`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success('Téléchargement démarré');
      } else {
        toast.error('Erreur lors du téléchargement');
      }
    } catch (error) {
      console.error('Erreur téléchargement:', error);
      toast.error('Erreur lors du téléchargement');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-zinc-400">Chargement de vos commandes...</p>
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="min-h-screen bg-zinc-900 flex items-center justify-center">
        <div className="text-center">
          <Package className="h-16 w-16 text-zinc-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Aucune commande trouvée</h1>
          <p className="text-zinc-400 mb-6">Les commandes demandées n'ont pas pu être chargées.</p>
          <Button onClick={() => router.push('/')} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour à l'accueil
          </Button>
        </div>
      </div>
    );
  }

  const totalAmount = orders.reduce((sum, order) => sum + order.amount, 0);

  return (
    <div className="min-h-screen bg-zinc-900 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-white mb-2">Commande confirmée !</h1>
          <p className="text-zinc-400">
            Merci pour votre achat. Vos {orders.length} commande{orders.length > 1 ? 's' : ''} ont été traitées avec succès.
          </p>
        </div>

        {/* Résumé */}
        <Card className="bg-zinc-800 border-zinc-700 mb-8">
          <CardHeader>
            <CardTitle className="text-white">Résumé de la commande</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center">
              <span className="text-zinc-400">
                {orders.length} produit{orders.length > 1 ? 's' : ''} acheté{orders.length > 1 ? 's' : ''}
              </span>
              <span className="text-2xl font-bold text-white">
                {totalAmount.toFixed(2)} €
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Produits achetés */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-white">Produits achetés</h2>
          
          {orders.map((order) => (
            <Card key={order.id} className="bg-zinc-800 border-zinc-700">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-white mb-2">
                      {order.product.title}
                    </h3>
                    <div className="flex items-center gap-4 mb-4">
                      <Badge variant="outline" className="border-zinc-600 text-zinc-400">
                        {order.product.resource_type || 'non_escrow'}
                      </Badge>
                      <span className="text-lg font-bold text-green-500">
                        {order.amount.toFixed(2)} €
                      </span>
                    </div>
                  </div>
                  
                  <Button
                    onClick={() => handleDownload(order.id, order.product.id)}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Télécharger
                  </Button>
                </div>

                {/* Information pour les ressources escrow */}
                {order.product.resource_type === 'escrow' && (
                  <div className="mt-4 p-4 bg-orange-500/20 border border-orange-500/30 rounded-lg">
                    <div className="flex items-center space-x-2 text-orange-400">
                      <Package className="h-5 w-5" />
                      <span className="font-semibold">Ressource Escrow</span>
                    </div>
                    <p className="text-sm text-orange-300 mt-1">
                      Cette ressource nécessite une livraison manuelle. Le vendeur vous contactera bientôt.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Actions */}
        <div className="flex justify-center gap-4 mt-8">
          <Button
            onClick={() => router.push('/account/purchases')}
            variant="outline"
            className="border-zinc-600 text-zinc-300 hover:bg-zinc-700"
          >
            Voir mes achats
          </Button>
          <Button
            onClick={() => router.push('/')}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Continuer mes achats
          </Button>
        </div>
      </div>
    </div>
  );
}
