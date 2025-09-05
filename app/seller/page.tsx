"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/useToast';
import { 
  Package, 
  TrendingUp, 
  DollarSign, 
  Users, 
  ShoppingCart,
  Plus,
  Eye,
  Edit,
  BarChart3,
  Calendar,
  Star,
  Download,
  MessageSquare,
  LogOut
} from 'lucide-react';

interface SellerStats {
  totalProducts: number;
  totalSales: number;
  approvedProducts: number;
  pendingProducts: number;
  rejectedProducts: number;
  sellerRevenue: number;
  platformRevenue: number;
}

interface Product {
  id: string;
  title: string;
  price: number;
  status: 'draft' | 'pending' | 'approved' | 'rejected' | 'suspended';
  download_count: number;
  created_at: string;
  updated_at: string;
  category: string;
  framework: string;
  images?: string;
}

interface Order {
  id: string;
  resource_id: string;
  user_id: string;
  total_price: number;
  status: string;
  created_at: string;
  resource_title: string;
  buyer_username: string;
}

export default function SellerDashboard() {
  const router = useRouter();
  const { user, profile, loading } = useAuth();
  const [stats, setStats] = useState<SellerStats>({
    totalProducts: 0,
    totalSales: 0,
    approvedProducts: 0,
    pendingProducts: 0,
    rejectedProducts: 0,
    sellerRevenue: 0,
    platformRevenue: 0
  });
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [lastLoadTime, setLastLoadTime] = useState<number>(0);

  useEffect(() => {
    if (!loading && profile?.role !== 'seller') {
      toast({
        title: 'Accès refusé',
        description: 'Vous devez être vendeur pour accéder à cette page.',
        variant: 'destructive'
      });
      router.push('/account');
      return;
    }

    if (profile?.role === 'seller') {
      loadSellerData();
    }
  }, [profile, loading, router]);

  const loadSellerData = async () => {
    try {
      // Cache simple : ne pas recharger si les données ont été chargées il y a moins de 30 secondes
      const now = Date.now();
      if (lastLoadTime && (now - lastLoadTime) < 30000) {
        return;
      }

      setLoadingData(true);
      
      // Charger toutes les données en parallèle pour réduire le temps de chargement
      const [statsResponse, productsResponse, ordersResponse] = await Promise.allSettled([
        fetch('/api/seller/stats'),
        fetch('/api/seller/products?limit=5'),
        fetch('/api/seller/orders?limit=5')
      ]);

      // Traiter les statistiques
      if (statsResponse.status === 'fulfilled' && statsResponse.value.ok) {
        const statsData = await statsResponse.value.json();
        setStats(statsData);
      } else {
        console.error('Erreur API statistiques:', statsResponse.status === 'rejected' ? statsResponse.reason : statsResponse.value.status);
      }

      // Traiter les produits
      if (productsResponse.status === 'fulfilled' && productsResponse.value.ok) {
        const productsData = await productsResponse.value.json();
        setProducts(productsData.products || []);
      } else {
        console.error('Erreur API produits:', productsResponse.status === 'rejected' ? productsResponse.reason : productsResponse.value.status);
      }

      // Traiter les commandes
      if (ordersResponse.status === 'fulfilled' && ordersResponse.value.ok) {
        const ordersData = await ordersResponse.value.json();
        setOrders(ordersData.orders || []);
      } else {
        console.error('Erreur API commandes:', ordersResponse.status === 'rejected' ? ordersResponse.reason : ordersResponse.value.status);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les données du tableau de bord',
        variant: 'destructive'
      });
    } finally {
      setLoadingData(false);
      setLastLoadTime(Date.now());
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Approuvé</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">En attente</Badge>;
      case 'rejected':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Rejeté</Badge>;
      case 'suspended':
        return <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">Suspendu</Badge>;
      default:
        return <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30">Brouillon</Badge>;
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
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading || loadingData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#FF7101]"></div>
          <p className="text-gray-400 text-sm">Chargement du dashboard...</p>
        </div>
      </div>
    );
  }

  if (!profile || (profile.role !== 'seller' && profile.role !== 'admin')) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* En-tête */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Tableau de bord Vendeur</h1>
            <p className="text-gray-400 mt-2">
              Gérez vos produits, suivez vos ventes et analysez vos performances
            </p>
          </div>
          <Button 
            onClick={() => router.push('/sell/new')}
            className="bg-[#FF7101] hover:bg-[#FF7101]/90 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nouveau Produit
          </Button>
        </div>
      </div>

      {/* Statistiques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="bg-zinc-800/50 border-zinc-700">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-blue-500/20 rounded-lg">
                <Package className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Produits Totaux</p>
                <p className="text-2xl font-bold text-white">{stats.totalProducts}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-800/50 border-zinc-700">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-green-500/20 rounded-lg">
                <TrendingUp className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Ventes Totales</p>
                <p className="text-2xl font-bold text-white">{stats.totalSales}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-800/50 border-zinc-700">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-yellow-500/20 rounded-lg">
                <ShoppingCart className="w-6 h-6 text-yellow-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Produits en Attente</p>
                <p className="text-2xl font-bold text-white">{stats.pendingProducts}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-800/50 border-zinc-700">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-emerald-500/20 rounded-lg">
                <DollarSign className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Mes Revenus</p>
                <p className="text-2xl font-bold text-white">{formatPrice(stats.sellerRevenue)}</p>
                <p className="text-sm text-gray-400 mt-1">
                  Revenus générés
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Statistiques détaillées */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <Card className="bg-zinc-800/50 border-zinc-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center space-x-2">
              <BarChart3 className="w-5 h-5" />
              <span>Statut des Produits</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Approuvés</span>
              <Badge className="bg-green-500/20 text-green-400">{stats.approvedProducts}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">En attente</span>
              <Badge className="bg-yellow-500/20 text-yellow-400">{stats.pendingProducts}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Rejetés</span>
              <Badge className="bg-red-500/20 text-red-400">{stats.rejectedProducts}</Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-800/50 border-zinc-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center space-x-2">
              <Calendar className="w-5 h-5" />
              <span>Ce Mois</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Ventes</span>
              <span className="text-white font-semibold">{stats.monthlySales}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Revenus</span>
              <span className="text-white font-semibold">{formatPrice(stats.monthlyRevenue)}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-800/50 border-zinc-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center space-x-2">
              <Star className="w-5 h-5" />
              <span>Actions Rapides</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button 
              variant="outline" 
              className="w-full justify-start border-zinc-600 text-zinc-300 hover:bg-zinc-700"
              onClick={() => router.push('/sell/new')}
            >
              <Plus className="w-4 h-4 mr-2" />
              Créer un produit
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start border-zinc-600 text-zinc-300 hover:bg-zinc-700"
              onClick={() => router.push('/seller/products')}
            >
              <Edit className="w-4 h-4 mr-2" />
              Gérer mes produits
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start border-zinc-600 text-zinc-300 hover:bg-zinc-700"
              onClick={() => router.push('/seller/analytics')}
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              Voir les analyses
            </Button>
            <Button 
              variant="outline" 
              className="w-full justify-start border-zinc-600 text-zinc-300 hover:bg-zinc-700"
              onClick={() => router.push('/')}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Quitter le dashboard
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Onglets pour les détails */}
      <Tabs defaultValue="products" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 bg-zinc-800/50">
          <TabsTrigger value="products" className="flex items-center space-x-2">
            <Package className="w-4 h-4" />
            <span>Mes Produits</span>
          </TabsTrigger>
          <TabsTrigger value="orders" className="flex items-center space-x-2">
            <ShoppingCart className="w-4 h-4" />
            <span>Commandes</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center space-x-2">
            <BarChart3 className="w-4 h-4" />
            <span>Analyses</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="products">
          <Card className="bg-zinc-800/50 border-zinc-700">
            <CardHeader>
              <CardTitle className="text-white">Mes Produits</CardTitle>
            </CardHeader>
            <CardContent>
              {products.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-400 mb-4">Vous n'avez pas encore de produits</p>
                  <Button 
                    onClick={() => router.push('/sell/new')}
                    className="bg-[#FF7101] hover:bg-[#FF7101]/90 text-white"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Créer votre premier produit
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {products.slice(0, 5).map((product) => (
                    <div key={product.id} className="flex items-center justify-between p-4 bg-zinc-900/50 rounded-lg border border-zinc-700">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-white font-medium">{product.title}</h3>
                          {getStatusBadge(product.status)}
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-gray-400">
                          <span>{formatPrice(product.price)}</span>
                          <span>•</span>
                          <span>{product.download_count} téléchargements</span>
                          <span>•</span>
                          <span>{product.category}</span>
                          <span>•</span>
                          <span>{product.framework}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => router.push(`/product/${product.id}`)}
                          className="border-zinc-600 text-zinc-300 hover:bg-zinc-700"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => router.push(`/sell/edit/${product.id}`)}
                          className="border-zinc-600 text-zinc-300 hover:bg-zinc-700"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {products.length > 5 && (
                    <div className="text-center pt-4">
                      <Button 
                        variant="outline"
                        onClick={() => router.push('/sell')}
                        className="border-zinc-600 text-zinc-300 hover:bg-zinc-700"
                      >
                        Voir tous les produits ({products.length})
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders">
          <Card className="bg-zinc-800/50 border-zinc-700">
            <CardHeader>
              <CardTitle className="text-white">Commandes Récentes</CardTitle>
            </CardHeader>
            <CardContent>
              {orders.length === 0 ? (
                <div className="text-center py-8">
                  <ShoppingCart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-400">Aucune commande pour le moment</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.slice(0, 5).map((order) => (
                    <div key={order.id} className="flex items-center justify-between p-4 bg-zinc-900/50 rounded-lg border border-zinc-700">
                      <div className="flex-1">
                        <h3 className="text-white font-medium mb-1">{order.resource_title}</h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-400">
                          <span>Acheté par {order.buyer_username}</span>
                          <span>•</span>
                          <span>{formatDate(order.created_at)}</span>
                          <span>•</span>
                          <span className="text-green-400 font-medium">{formatPrice(order.total_price)}</span>
                        </div>
                      </div>
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                        {order.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <Card className="bg-zinc-800/50 border-zinc-700">
            <CardHeader>
              <CardTitle className="text-white">Analyses Détaillées</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-400 mb-4">Les analyses détaillées seront bientôt disponibles</p>
                <Button 
                  variant="outline"
                  className="border-zinc-600 text-zinc-300 hover:bg-zinc-700"
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Voir les analyses complètes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
