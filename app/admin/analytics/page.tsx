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
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  DollarSign, 
  Package,
  Users,
  Calendar,
  ShoppingCart,
  ArrowLeft,
  Filter,
  Building2
} from 'lucide-react';

interface PlatformStats {
  revenue: {
    total: number;
    monthly: number;
    platform: {
      total: number;
      monthly: number;
    };
  };
  orders: {
    total: number;
    monthly: number;
  };
  products: {
    total: number;
    approved: number;
    pending: number;
  };
  users: {
    total: number;
    sellers: number;
    admins: number;
  };
  monthlyData: Array<{
    month: string;
    revenue: number;
    platformRevenue: number;
    orders: number;
  }>;
}

export default function AdminAnalytics() {
  const router = useRouter();
  const { user, profile, loading } = useAuth();
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (!loading && profile?.role !== 'admin') {
      toast({
        title: 'Accès refusé',
        description: 'Vous devez être administrateur pour accéder à cette page.',
        variant: 'destructive'
      });
      router.push('/account');
      return;
    }

    if (profile?.role === 'admin') {
      loadPlatformStats();
    }
  }, [profile, loading, router]);

  const loadPlatformStats = async () => {
    try {
      setLoadingData(true);
      
      const response = await fetch('/api/admin/platform-stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      } else {
        console.error('Erreur API statistiques plateforme:', response.status, response.statusText);
        toast({
          title: 'Erreur',
          description: 'Impossible de charger les statistiques de la plateforme',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les statistiques de la plateforme',
        variant: 'destructive'
      });
    } finally {
      setLoadingData(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(price);
  };

  const formatPercentage = (value: number) => {
    return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  const getTrendIcon = (value: number) => {
    return value > 0 ? (
      <TrendingUp className="w-4 h-4 text-green-400" />
    ) : (
      <TrendingDown className="w-4 h-4 text-red-400" />
    );
  };

  const getTrendColor = (value: number) => {
    return value > 0 ? 'text-green-400' : 'text-red-400';
  };

  if (loading || loadingData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#FF7101] mx-auto"></div>
      </div>
    );
  }

  if (!profile || profile.role !== 'admin') {
    return null;
  }

  if (!stats) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Aucune donnée disponible</h2>
          <p className="text-gray-400">Les statistiques de la plateforme seront disponibles une fois que des données seront présentes.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* En-tête */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/admin')}
              className="border-zinc-600 text-zinc-300 hover:bg-zinc-700"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-white">Analyses de la Plateforme</h1>
              <p className="text-gray-400 mt-2">
                Vue d'ensemble des performances de FiveMarket
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Building2 className="w-6 h-6 text-[#FF7101]" />
            <span className="text-sm text-gray-400">Administration</span>
          </div>
        </div>
      </div>

      {/* Métriques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="bg-zinc-800/50 border-zinc-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Revenus Plateforme</p>
                <p className="text-2xl font-bold text-white">{formatPrice(stats.revenue.platform.total)}</p>
                <div className="flex items-center space-x-1 mt-1">
                  <span className="text-sm text-gray-400">Total</span>
                </div>
              </div>
              <div className="p-3 bg-emerald-500/20 rounded-lg">
                <DollarSign className="w-6 h-6 text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-800/50 border-zinc-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Commandes Totales</p>
                <p className="text-2xl font-bold text-white">{stats.orders.total}</p>
                <div className="flex items-center space-x-1 mt-1">
                  <span className="text-sm text-gray-400">Ce mois: {stats.orders.monthly}</span>
                </div>
              </div>
              <div className="p-3 bg-blue-500/20 rounded-lg">
                <ShoppingCart className="w-6 h-6 text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-800/50 border-zinc-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Produits Actifs</p>
                <p className="text-2xl font-bold text-white">{stats.products.approved}</p>
                <div className="flex items-center space-x-1 mt-1">
                  <span className="text-sm text-gray-400">En attente: {stats.products.pending}</span>
                </div>
              </div>
              <div className="p-3 bg-purple-500/20 rounded-lg">
                <Package className="w-6 h-6 text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-800/50 border-zinc-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Utilisateurs</p>
                <p className="text-2xl font-bold text-white">{stats.users.total}</p>
                <div className="flex items-center space-x-1 mt-1">
                  <span className="text-sm text-gray-400">Vendeurs: {stats.users.sellers}</span>
                </div>
              </div>
              <div className="p-3 bg-orange-500/20 rounded-lg">
                <Users className="w-6 h-6 text-orange-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Onglets pour les analyses détaillées */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 bg-zinc-800/50">
          <TabsTrigger value="overview" className="flex items-center space-x-2">
            <BarChart3 className="w-4 h-4" />
            <span>Vue d'ensemble</span>
          </TabsTrigger>
          <TabsTrigger value="revenue" className="flex items-center space-x-2">
            <DollarSign className="w-4 h-4" />
            <span>Revenus</span>
          </TabsTrigger>
          <TabsTrigger value="growth" className="flex items-center space-x-2">
            <TrendingUp className="w-4 h-4" />
            <span>Croissance</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Graphique des revenus mensuels */}
            <Card className="bg-zinc-800/50 border-zinc-700">
              <CardHeader>
                <CardTitle className="text-white">Évolution des Revenus Plateforme</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats.monthlyData.map((data, index) => (
                    <div key={data.month} className="flex items-center justify-between">
                      <span className="text-gray-400">{data.month}</span>
                      <div className="flex items-center space-x-4">
                        <div className="w-32 bg-zinc-700 rounded-full h-2">
                          <div 
                            className="bg-[#FF7101] h-2 rounded-full" 
                            style={{ width: `${(data.platformRevenue / Math.max(...stats.monthlyData.map(d => d.platformRevenue))) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-white font-medium w-16 text-right">
                          {formatPrice(data.platformRevenue)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Statistiques détaillées */}
            <Card className="bg-zinc-800/50 border-zinc-700">
              <CardHeader>
                <CardTitle className="text-white">Statistiques Détaillées</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Revenus totaux (tous vendeurs)</span>
                    <span className="text-white font-medium">{formatPrice(stats.revenue.total)}</span>
                  </div>
                                     <div className="flex items-center justify-between">
                     <span className="text-gray-400">Commission plateforme (20%)</span>
                     <span className="text-white font-medium">{formatPrice(stats.revenue.platform.total)}</span>
                   </div>
                   <div className="flex items-center justify-between">
                     <span className="text-gray-400">Revenus vendeurs (80%)</span>
                     <span className="text-white font-medium">{formatPrice(stats.revenue.total * 0.8)}</span>
                   </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Commandes par mois (moyenne)</span>
                    <span className="text-white font-medium">
                      {(stats.orders.total / 6).toFixed(1)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Taux d'approbation produits</span>
                    <span className="text-white font-medium">
                      {((stats.products.approved / stats.products.total) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="revenue">
          <Card className="bg-zinc-800/50 border-zinc-700">
            <CardHeader>
              <CardTitle className="text-white">Répartition des Revenus</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="p-4 bg-zinc-900/50 rounded-lg border border-zinc-700">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-white font-medium">Revenus de la Plateforme</h3>
                    <Badge className="bg-emerald-500/20 text-emerald-400">
                      {formatPrice(stats.revenue.platform.total)}
                    </Badge>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Total</span>
                      <span className="text-white font-medium">{formatPrice(stats.revenue.platform.total)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Ce mois</span>
                      <span className="text-white font-medium">{formatPrice(stats.revenue.platform.monthly)}</span>
                    </div>
                                         <div className="flex items-center justify-between">
                       <span className="text-gray-400">Part du total</span>
                       <span className="text-white font-medium">20%</span>
                     </div>
                  </div>
                </div>

                <div className="p-4 bg-zinc-900/50 rounded-lg border border-zinc-700">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-white font-medium">Revenus des Vendeurs</h3>
                                         <Badge className="bg-blue-500/20 text-blue-400">
                       {formatPrice(stats.revenue.total * 0.8)}
                     </Badge>
                  </div>
                  <div className="space-y-3">
                                         <div className="flex items-center justify-between">
                       <span className="text-gray-400">Total</span>
                       <span className="text-white font-medium">{formatPrice(stats.revenue.total * 0.8)}</span>
                     </div>
                     <div className="flex items-center justify-between">
                       <span className="text-gray-400">Ce mois</span>
                       <span className="text-white font-medium">{formatPrice(stats.revenue.monthly * 0.8)}</span>
                     </div>
                     <div className="flex items-center justify-between">
                       <span className="text-gray-400">Part du total</span>
                       <span className="text-white font-medium">80%</span>
                     </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="growth">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-zinc-800/50 border-zinc-700">
              <CardHeader>
                <CardTitle className="text-white">Croissance des Utilisateurs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Total utilisateurs</span>
                    <span className="text-white font-medium">{stats.users.total}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Vendeurs actifs</span>
                    <span className="text-white font-medium">{stats.users.sellers}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Taux de vendeurs</span>
                    <span className="text-white font-medium">
                      {((stats.users.sellers / stats.users.total) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-zinc-800/50 border-zinc-700">
              <CardHeader>
                <CardTitle className="text-white">Croissance des Produits</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Total produits</span>
                    <span className="text-white font-medium">{stats.products.total}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Produits approuvés</span>
                    <span className="text-white font-medium">{stats.products.approved}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">En attente d'approbation</span>
                    <span className="text-white font-medium">{stats.products.pending}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
