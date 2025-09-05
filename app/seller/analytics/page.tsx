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
  Package,
  Calendar,
  Download,
  ArrowLeft,
  Filter,
  DollarSign,
  Eye
} from 'lucide-react';

interface AnalyticsData {
  sales: {
    total: number;
  };
  revenue: {
    total: number;
    platform: number;
  };
  products: {
    total: number;
    approved: number;
    pending: number;
    rejected: number;
  };
  performance: {
    topProducts: Array<{
      id: string;
      title: string;
      downloads: number;
    }>;
    categoryData: Array<{
      category: string;
      count: number;
    }>;
  };
}

export default function SellerAnalytics() {
  const router = useRouter();
  const { user, profile, loading } = useAuth();
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loadingData, setLoadingData] = useState(true);

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
      loadAnalyticsData();
    }
  }, [profile, loading, router]);

  const loadAnalyticsData = async () => {
    try {
      setLoadingData(true);
      
      const response = await fetch('/api/seller/analytics');
      if (response.ok) {
        const data = await response.json();
        setAnalyticsData(data);
      } else {
        console.error('Erreur API analyses:', response.status, response.statusText);
        toast({
          title: 'Erreur',
          description: 'Impossible de charger les données d\'analyses',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Erreur lors du chargement des analyses:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les données d\'analyses',
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

  if (loading || loadingData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#FF7101] mx-auto"></div>
      </div>
    );
  }

  if (!profile || (profile.role !== 'seller' && profile.role !== 'admin')) {
    return null;
  }

  if (!analyticsData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Aucune donnée disponible</h2>
          <p className="text-gray-400">Les analyses seront disponibles une fois que vous aurez des ventes.</p>
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
              onClick={() => router.push('/seller')}
              className="border-zinc-600 text-zinc-300 hover:bg-zinc-700"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-white">Analyses Détaillées</h1>
              <p className="text-gray-400 mt-2">
                Suivez vos performances et optimisez vos ventes
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Métriques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">

        <Card className="bg-zinc-800/50 border-zinc-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Ventes Totales</p>
                <p className="text-2xl font-bold text-white">{analyticsData.sales.total}</p>
                <p className="text-sm text-gray-400 mt-1">
                  Téléchargements totaux
                </p>
              </div>
              <div className="p-3 bg-blue-500/20 rounded-lg">
                <TrendingUp className="w-6 h-6 text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-800/50 border-zinc-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Produits Actifs</p>
                <p className="text-2xl font-bold text-white">{analyticsData.products.approved}</p>
                <p className="text-sm text-gray-400 mt-1">
                  Produits approuvés
                </p>
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
                <p className="text-sm text-gray-400">Mes Revenus</p>
                <p className="text-2xl font-bold text-white">{formatPrice(analyticsData.revenue.total)}</p>
                <p className="text-sm text-gray-400 mt-1">
                  Revenus générés
                </p>
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
                <p className="text-sm text-gray-400">Produits en Attente</p>
                <p className="text-2xl font-bold text-white">{analyticsData.products.pending}</p>
                <p className="text-sm text-gray-400 mt-1">
                  En cours de validation
                </p>
              </div>
              <div className="p-3 bg-orange-500/20 rounded-lg">
                <Calendar className="w-6 h-6 text-orange-400" />
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
          <TabsTrigger value="products" className="flex items-center space-x-2">
            <Package className="w-4 h-4" />
            <span>Produits</span>
          </TabsTrigger>
          <TabsTrigger value="categories" className="flex items-center space-x-2">
            <Filter className="w-4 h-4" />
            <span>Catégories</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">

            {/* Top produits */}
            <Card className="bg-zinc-800/50 border-zinc-700">
              <CardHeader>
                <CardTitle className="text-white">Top Produits</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData.performance.topProducts.slice(0, 5).map((product, index) => (
                    <div key={product.id} className="flex items-center justify-between p-3 bg-zinc-900/50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-[#FF7101] rounded-full flex items-center justify-center text-white font-bold text-sm">
                          {index + 1}
                        </div>
                        <div>
                          <p className="text-white font-medium">{product.title}</p>
                          <p className="text-sm text-gray-400">{product.downloads} téléchargements</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="products">
          <Card className="bg-zinc-800/50 border-zinc-700">
            <CardHeader>
              <CardTitle className="text-white">Performance des Produits</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analyticsData.performance.topProducts.map((product) => (
                  <div key={product.id} className="p-4 bg-zinc-900/50 rounded-lg border border-zinc-700">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-white font-medium">{product.title}</h3>
                      <div className="flex items-center space-x-2">
                        <Badge className="bg-green-500/20 text-green-400">Actif</Badge>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => router.push(`/product/${product.id}`)}
                          className="border-zinc-600 text-zinc-300 hover:bg-zinc-700"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-white">{product.sales}</p>
                        <p className="text-sm text-gray-400">Ventes</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-white">{formatPrice(product.revenue)}</p>
                        <p className="text-sm text-gray-400">Revenus</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-white">{product.downloads}</p>
                        <p className="text-sm text-gray-400">Téléchargements</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="revenue">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-zinc-800/50 border-zinc-700">
              <CardHeader>
                <CardTitle className="text-white">Répartition des Revenus</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData.performance.categoryData.map((category, index) => (
                    <div key={category.category} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div 
                          className="w-4 h-4 rounded-full"
                          style={{ 
                            backgroundColor: ['#FF7101', '#3B82F6', '#10B981', '#F59E0B'][index % 4]
                          }}
                        ></div>
                        <span className="text-gray-400">{category.category}</span>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="w-32 bg-zinc-700 rounded-full h-2">
                          <div 
                            className="h-2 rounded-full" 
                            style={{ 
                              width: `${(category.count / Math.max(...analyticsData.performance.categoryData.map(c => c.count))) * 100}%`,
                              backgroundColor: ['#FF7101', '#3B82F6', '#10B981', '#F59E0B'][index % 4]
                            }}
                          ></div>
                        </div>
                        <span className="text-white font-medium w-16 text-right">
                          {category.count} produits
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-zinc-800/50 border-zinc-700">
              <CardHeader>
                <CardTitle className="text-white">Statistiques Détaillées</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Téléchargements par jour (moyenne)</span>
                    <span className="text-white font-medium">
                      {(analyticsData.sales.total / 30).toFixed(1)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Taux d'approbation</span>
                    <span className="text-white font-medium">
                      {analyticsData.products.total > 0 ? ((analyticsData.products.approved / analyticsData.products.total) * 100).toFixed(1) : 0}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Produit le plus téléchargé</span>
                    <span className="text-white font-medium">
                      {analyticsData.performance.topProducts[0]?.title || 'N/A'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="categories">
          <Card className="bg-zinc-800/50 border-zinc-700">
            <CardHeader>
              <CardTitle className="text-white">Performance par Catégorie</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {analyticsData.performance.categoryData.map((category, index) => (
                  <div key={category.category} className="p-4 bg-zinc-900/50 rounded-lg border border-zinc-700">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-white font-medium">{category.category}</h3>
                      <Badge className="bg-blue-500/20 text-blue-400">
                        {category.count} produits
                      </Badge>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Produits</span>
                        <span className="text-white font-medium">{category.count}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Part du total</span>
                        <span className="text-white font-medium">
                          {((category.count / analyticsData.products.total) * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
