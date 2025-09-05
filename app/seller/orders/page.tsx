'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Package, 
  ExternalLink, 
  CheckCircle, 
  Clock, 
  User, 
  DollarSign,
  AlertCircle,
  Eye,
  ArrowLeft
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface Order {
  id: string;
  amount: number;
  status: string;
  created_at: string;
  paid_at: string;
  buyer: {
    id: string;
    username: string;
    auth_email: string;
  };
  resource: {
    id: string;
    title: string;
    resource_type: string;
  };
  escrow_info?: {
    cfx_id?: string;
    email?: string;
    username?: string;
    submitted_at: string;
  };
}

export default function SellerOrders() {
  const router = useRouter();
  const { user, profile, loading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [filter, setFilter] = useState<'all' | 'escrow' | 'non_escrow'>('all');

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
      return;
    }

    if (user) {
      loadOrders();
    }
  }, [user, loading, router]);

  const loadOrders = async () => {
    try {
      setLoadingOrders(true);
      const response = await fetch('/api/seller/orders-detailed');
      
      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders || []);
      } else {
        console.error('Erreur chargement commandes');
        toast.error('Erreur lors du chargement des commandes');
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors du chargement des commandes');
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleTebexRedirect = (order: Order) => {
    // Ouvrir Tebex dans un nouvel onglet
    window.open('https://creator.tebex.io/payments/create', '_blank');
    
    // Marquer la commande comme en cours de traitement
    toast.info('Redirection vers Tebex... N\'oubliez pas de confirmer l\'envoi après avoir créé le paiement.');
  };

  const handleConfirmDelivery = async (orderId: string) => {
    try {
      const response = await fetch(`/api/seller/orders/${orderId}/confirm-delivery`, {
        method: 'POST'
      });

      if (response.ok) {
        toast.success('Livraison confirmée ! L\'acheteur a été notifié.');
        loadOrders(); // Recharger les commandes
      } else {
        const error = await response.json();
        toast.error(error.error || 'Erreur lors de la confirmation');
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de la confirmation');
    }
  };

  const filteredOrders = orders.filter(order => {
    if (filter === 'escrow') return order.resource.resource_type === 'escrow';
    if (filter === 'non_escrow') return order.resource.resource_type === 'non_escrow';
    return true;
  });

  const escrowOrders = orders.filter(order => order.resource.resource_type === 'escrow');
  const pendingEscrowOrders = escrowOrders.filter(order => order.status === 'completed');
  const deliveredOrders = orders.filter(order => order.status === 'delivered');

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-zinc-400">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-900 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button
              onClick={() => router.push('/seller')}
              variant="outline"
              className="border-zinc-600 text-zinc-300 hover:bg-zinc-700"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-white">Commandes</h1>
              <p className="text-zinc-400">Gérez vos commandes et livraisons</p>
            </div>
          </div>
        </div>

        {/* Notifications */}
        {pendingEscrowOrders.length > 0 && (
          <Card className="bg-orange-500/20 border-orange-500/30 mb-6">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <AlertCircle className="h-5 w-5 text-orange-400" />
                <div>
                  <h3 className="font-semibold text-orange-400">
                    {pendingEscrowOrders.length} commande{pendingEscrowOrders.length > 1 ? 's' : ''} escrow en attente
                  </h3>
                  <p className="text-sm text-orange-300">
                    Vous devez créer les paiements sur Tebex et confirmer la livraison
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Statistiques */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-zinc-800 border-zinc-700">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <Package className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="text-2xl font-bold text-white">{orders.length}</p>
                  <p className="text-zinc-400">Total commandes</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-800 border-zinc-700">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <AlertCircle className="h-8 w-8 text-orange-500" />
                <div>
                  <p className="text-2xl font-bold text-white">{escrowOrders.length}</p>
                  <p className="text-zinc-400">Commandes escrow</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-800 border-zinc-700">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-8 w-8 text-green-500" />
                <div>
                  <p className="text-2xl font-bold text-white">
                    {deliveredOrders.length}
                  </p>
                  <p className="text-zinc-400">Livrées</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-zinc-800 border-zinc-700">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <DollarSign className="h-8 w-8 text-green-500" />
                <div>
                  <p className="text-2xl font-bold text-white">
                    {orders.reduce((sum, order) => sum + order.amount, 0).toFixed(2)} €
                  </p>
                  <p className="text-zinc-400">Chiffre d'affaires</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtres et commandes */}
        <Tabs value={filter} onValueChange={(value) => setFilter(value as any)}>
          <TabsList className="grid w-full grid-cols-3 bg-zinc-800">
            <TabsTrigger value="all" className="data-[state=active]:bg-zinc-700">
              Toutes ({orders.length})
            </TabsTrigger>
            <TabsTrigger value="escrow" className="data-[state=active]:bg-zinc-700">
              Escrow ({escrowOrders.length})
            </TabsTrigger>
            <TabsTrigger value="non_escrow" className="data-[state=active]:bg-zinc-700">
              Non-escrow ({orders.filter(o => o.resource.resource_type === 'non_escrow').length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value={filter} className="mt-6">
            {loadingOrders ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
                <p className="text-zinc-400">Chargement des commandes...</p>
              </div>
            ) : filteredOrders.length === 0 ? (
              <Card className="bg-zinc-800 border-zinc-700">
                <CardContent className="p-8 text-center">
                  <Package className="h-12 w-12 text-zinc-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-2">Aucune commande</h3>
                  <p className="text-zinc-400">Vous n'avez pas encore de commandes pour ce filtre.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredOrders.map((order) => (
                  <Card key={order.id} className="bg-zinc-800 border-zinc-700">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-3">
                            <h3 className="text-lg font-semibold text-white">
                              {order.resource.title}
                            </h3>
                            <Badge 
                              variant={order.resource.resource_type === 'escrow' ? 'default' : 'outline'}
                              className={order.resource.resource_type === 'escrow' 
                                ? 'bg-orange-500 text-white' 
                                : 'border-zinc-600 text-zinc-400'
                              }
                            >
                              {order.resource.resource_type === 'escrow' ? 'Escrow' : 'Non-escrow'}
                            </Badge>
                            <Badge 
                              variant={order.status === 'delivered' ? 'default' : 'outline'}
                              className={order.status === 'delivered' 
                                ? 'bg-green-500 text-white' 
                                : order.status === 'completed'
                                ? 'bg-blue-500 text-white'
                                : 'border-zinc-600 text-zinc-400'
                              }
                            >
                              {order.status === 'delivered' ? 'Livrée' : 
                               order.status === 'completed' ? 'Payée' : 'En attente'}
                            </Badge>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div className="flex items-center space-x-2 text-zinc-400">
                              <User className="h-4 w-4" />
                              <span>Acheteur: {order.buyer.username}</span>
                            </div>
                            <div className="flex items-center space-x-2 text-zinc-400">
                              <DollarSign className="h-4 w-4" />
                              <span>Montant: {order.amount.toFixed(2)} €</span>
                            </div>
                            <div className="flex items-center space-x-2 text-zinc-400">
                              <Clock className="h-4 w-4" />
                              <span>Date: {new Date(order.created_at).toLocaleDateString('fr-FR')}</span>
                            </div>
                          </div>

                          {/* Informations escrow */}
                          {order.resource.resource_type === 'escrow' && order.escrow_info && (
                            <div className="bg-zinc-700/50 rounded-lg p-4 mb-4">
                              <h4 className="font-semibold text-white mb-2">Informations escrow :</h4>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                {order.escrow_info.cfx_id && (
                                  <div>
                                    <span className="text-zinc-400">CFX ID:</span>
                                    <p className="text-white font-mono">{order.escrow_info.cfx_id}</p>
                                  </div>
                                )}
                                {order.escrow_info.email && (
                                  <div>
                                    <span className="text-zinc-400">Email:</span>
                                    <p className="text-white">{order.escrow_info.email}</p>
                                  </div>
                                )}
                                {order.escrow_info.username && (
                                  <div>
                                    <span className="text-zinc-400">Username:</span>
                                    <p className="text-white">{order.escrow_info.username}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col space-y-2 ml-4">
                          {order.resource.resource_type === 'escrow' && order.status === 'completed' && (
                            <>
                              <Button
                                onClick={() => handleTebexRedirect(order)}
                                className="bg-orange-600 hover:bg-orange-700 text-white"
                              >
                                <ExternalLink className="h-4 w-4 mr-2" />
                                Créer paiement Tebex
                              </Button>
                              <Button
                                onClick={() => handleConfirmDelivery(order.id)}
                                variant="outline"
                                className="border-green-600 text-green-400 hover:bg-green-600/20"
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Confirmer livraison
                              </Button>
                            </>
                          )}
                          
                          {order.resource.resource_type === 'non_escrow' && order.status === 'completed' && (
                            <Button
                              onClick={() => handleConfirmDelivery(order.id)}
                              className="bg-green-600 hover:bg-green-700 text-white"
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Confirmer livraison
                            </Button>
                          )}

                          {order.status === 'delivered' && (
                            <div className="text-green-400 text-sm font-medium">
                              ✓ Livrée
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
