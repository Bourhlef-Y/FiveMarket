"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from '@/lib/supabase-browser';
import { Users, ShoppingBag, UserPlus, TrendingUp } from 'lucide-react';

interface DashboardStats {
  totalUsers: number;
  totalSellers: number;
  totalProducts: number;
  pendingRequests: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalSellers: 0,
    totalProducts: 0,
    pendingRequests: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const supabase = createClient();

        // Compter les utilisateurs par rôle
        const { data: userStats, error: userError } = await supabase
          .from('profiles')
          .select('role', { count: 'exact' })
          .eq('role', 'buyer');

        const { data: sellerStats, error: sellerError } = await supabase
          .from('profiles')
          .select('role', { count: 'exact' })
          .eq('role', 'seller');

        // Compter les produits
        const { data: productStats, error: productError } = await supabase
          .from('resources')
          .select('id', { count: 'exact' });

        // Compter les demandes vendeur en attente
        const { data: requestStats, error: requestError } = await supabase
          .from('seller_requests')
          .select('id', { count: 'exact' })
          .eq('status', 'pending');

        setStats({
          totalUsers: userStats?.length || 0,
          totalSellers: sellerStats?.length || 0,
          totalProducts: productStats?.length || 0,
          pendingRequests: requestStats?.length || 0
        });
      } catch (error) {
        console.error('Erreur chargement stats:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  const StatCard = ({ title, value, icon: Icon, color }: { 
    title: string;
    value: number;
    icon: any;
    color: string;
  }) => (
    <Card className="bg-zinc-800/50 border-zinc-700">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-zinc-400">{title}</p>
            <h3 className="text-2xl font-bold text-white mt-2">{value}</h3>
          </div>
          <div className={`p-3 rounded-full ${color}`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Dashboard Admin</h1>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#FF7101]"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            title="Utilisateurs"
            value={stats.totalUsers}
            icon={Users}
            color="bg-blue-500/20"
          />
          <StatCard
            title="Vendeurs"
            value={stats.totalSellers}
            icon={ShoppingBag}
            color="bg-[#FF7101]/20"
          />
          <StatCard
            title="Produits"
            value={stats.totalProducts}
            icon={TrendingUp}
            color="bg-green-500/20"
          />
          <StatCard
            title="Demandes Vendeur"
            value={stats.pendingRequests}
            icon={UserPlus}
            color="bg-yellow-500/20"
          />
        </div>
      )}

      {/* Graphiques et autres statistiques à venir */}
    </div>
  );
}
