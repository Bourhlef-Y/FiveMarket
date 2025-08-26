"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  TrendingUp, 
  DollarSign, 
  Package, 
  Users, 
  ShoppingCart,
  Eye,
  Download,
  Star,
  Plus,
  Calendar,
  BarChart3,
  PieChart,
  Activity
} from 'lucide-react';
import DashboardStats from '@/components/seller/DashboardStats';
import RevenueChart from '@/components/seller/RevenueChart';
import TopProducts from '@/components/seller/TopProducts';
import RecentOrders from '@/components/seller/RecentOrders';
import QuickActions from '@/components/seller/QuickActions';
import PerformanceMetrics from '@/components/seller/PerformanceMetrics';

export default function SellerDashboard() {
  const { user, profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d' | '1y'>('30d');

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/auth/sign-in');
        return;
      }
      
      if (profile?.role !== 'seller') {
        router.push('/account');
        return;
      }
      
      setLoading(false);
    }
  }, [user, profile, authLoading, router]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-zinc-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-[#FF7101]"></div>
      </div>
    );
  }

  if (!user || profile?.role !== 'seller') {
    return null;
  }

  return (
    <div className="min-h-screen bg-zinc-900 py-8">
      <div className="container mx-auto px-4">
        {/* En-tête */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Dashboard Vendeur</h1>
            <p className="text-zinc-400">
              Bienvenue {profile?.username}, voici un aperçu de vos performances
            </p>
          </div>
          
          <div className="flex items-center gap-4 mt-4 sm:mt-0">
            {/* Sélecteur de période */}
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-zinc-400" />
              <select 
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value as any)}
                className="bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2 text-zinc-100 text-sm"
              >
                <option value="7d">7 derniers jours</option>
                <option value="30d">30 derniers jours</option>
                <option value="90d">90 derniers jours</option>
                <option value="1y">Cette année</option>
              </select>
            </div>
            
            <Button
              onClick={() => router.push('/sell/new')}
              className="bg-[#FF7101] hover:bg-[#FF7101]/90 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nouveau produit
            </Button>
          </div>
        </div>

        {/* Statistiques principales */}
        <DashboardStats userId={user.id} period={selectedPeriod} />

        {/* Contenu principal */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
          {/* Colonne principale */}
          <div className="lg:col-span-2 space-y-8">
            {/* Graphique des revenus */}
            <Card className="bg-zinc-800/50 border-zinc-700">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Évolution des revenus
                    </CardTitle>
                    <CardDescription>
                      Vos revenus au cours des {selectedPeriod === '7d' ? '7 derniers jours' : 
                      selectedPeriod === '30d' ? '30 derniers jours' : 
                      selectedPeriod === '90d' ? '90 derniers jours' : 'cette année'}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <RevenueChart userId={user.id} period={selectedPeriod} />
              </CardContent>
            </Card>

            {/* Métriques de performance */}
            <PerformanceMetrics userId={user.id} period={selectedPeriod} />

            {/* Commandes récentes */}
            <RecentOrders userId={user.id} />
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Actions rapides */}
            <QuickActions />

            {/* Top produits */}
            <TopProducts userId={user.id} period={selectedPeriod} />

            {/* Insights et conseils */}
            <Card className="bg-zinc-800/50 border-zinc-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Conseils de performance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  <h4 className="text-blue-400 font-medium mb-2">💡 Optimisez vos descriptions</h4>
                  <p className="text-zinc-400 text-sm">
                    Les produits avec des descriptions détaillées ont 40% plus de chances d'être achetés.
                  </p>
                </div>
                
                <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <h4 className="text-green-400 font-medium mb-2">📸 Ajoutez plus d'images</h4>
                  <p className="text-zinc-400 text-sm">
                    Les produits avec 3+ images génèrent 25% plus de ventes.
                  </p>
                </div>

                <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                  <h4 className="text-purple-400 font-medium mb-2">🏷️ Prix compétitifs</h4>
                  <p className="text-zinc-400 text-sm">
                    Analysez les prix de la concurrence pour optimiser vos revenus.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
