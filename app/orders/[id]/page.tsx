"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/useToast';
import { 
  CheckCircle, 
  Package, 
  Download,
  ArrowLeft,
  Calendar,
  CreditCard,
  User
} from 'lucide-react';

interface Order {
  id: string;
  quantity: number;
  total_price: number;
  status: string;
  payment_status: string;
  created_at: string;
  product: {
    id: string;
    title: string;
    price: number;
    images?: string;
  };
}

export default function OrderConfirmationPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading } = useAuth();
  const [order, setOrder] = useState<Order | null>(null);
  const [loadingOrder, setLoadingOrder] = useState(true);

  const orderId = params.id as string;

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
      return;
    }

    if (orderId) {
      loadOrder();
    }
  }, [user, loading, orderId]);

  const loadOrder = async () => {
    try {
      setLoadingOrder(true);
      const response = await fetch(`/api/orders/${orderId}`);
      if (response.ok) {
        const data = await response.json();
        setOrder(data);
      } else {
        toast({
          title: 'Erreur',
          description: 'Commande non trouvée',
          variant: 'destructive'
        });
        router.push('/');
      }
    } catch (error) {
      console.error('Erreur chargement commande:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger la commande',
        variant: 'destructive'
      });
    } finally {
      setLoadingOrder(false);
    }
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
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading || loadingOrder) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#FF7101]"></div>
          <p className="text-gray-400 text-sm">Chargement de votre commande...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Commande non trouvée</h1>
          <Button onClick={() => router.push('/')}>
            Retour à l'accueil
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* En-tête */}
      <div className="mb-8 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500/20 rounded-full mb-4">
          <CheckCircle className="w-8 h-8 text-green-400" />
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">Commande confirmée !</h1>
        <p className="text-gray-400">Votre achat a été traité avec succès</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Détails de la commande */}
        <Card className="bg-zinc-800/50 border-zinc-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center space-x-2">
              <Package className="w-5 h-5" />
              <span>Détails de la commande</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start space-x-4">
              {order.product.images && (
                <img 
                  src={order.product.images} 
                  alt={order.product.title}
                  className="w-16 h-16 object-cover rounded-lg"
                />
              )}
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white">{order.product.title}</h3>
                <p className="text-sm text-gray-400">Prix unitaire : {formatPrice(order.product.price)}</p>
              </div>
            </div>

            <div className="border-t border-zinc-700 pt-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Quantité :</span>
                <span className="text-white">{order.quantity}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Prix unitaire :</span>
                <span className="text-white">{formatPrice(order.product.price)}</span>
              </div>
              <div className="border-t border-zinc-700 pt-2">
                <div className="flex items-center justify-between text-lg font-bold">
                  <span className="text-white">Total payé :</span>
                  <span className="text-[#FF7101]">{formatPrice(order.total_price)}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                {order.status === 'completed' ? 'Terminée' : order.status}
              </Badge>
              <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                {order.payment_status === 'paid' ? 'Payée' : order.payment_status}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Informations de livraison */}
        <Card className="bg-zinc-800/50 border-zinc-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center space-x-2">
              <Download className="w-5 h-5" />
              <span>Livraison</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-green-500/20 border border-green-500/30 rounded-lg p-4">
              <div className="flex items-center space-x-2 text-green-400 mb-2">
                <CheckCircle className="w-5 h-5" />
                <span className="font-semibold">Prêt au téléchargement</span>
              </div>
              <p className="text-sm text-green-300">
                Votre produit est immédiatement disponible au téléchargement
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-2 text-sm">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className="text-gray-400">Commande passée le :</span>
                <span className="text-white">{formatDate(order.created_at)}</span>
              </div>
              <div className="flex items-center space-x-2 text-sm">
                <CreditCard className="w-4 h-4 text-gray-400" />
                <span className="text-gray-400">Méthode de paiement :</span>
                <span className="text-white">Mode Développement</span>
              </div>
            </div>

            <Button
              onClick={() => {
                // Ici on pourrait implémenter le téléchargement réel
                toast({
                  title: 'Téléchargement',
                  description: 'Le téléchargement sera bientôt disponible',
                  variant: 'default'
                });
              }}
              className="w-full bg-[#FF7101] hover:bg-[#FF7101]/90 text-white"
            >
              <Download className="w-4 h-4 mr-2" />
              Télécharger le produit
            </Button>

            <Button
              variant="outline"
              onClick={() => router.push('/')}
              className="w-full border-zinc-600 text-zinc-300 hover:bg-zinc-700"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour à l'accueil
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
