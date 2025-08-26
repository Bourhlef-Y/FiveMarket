"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { 
  TrendingUp, 
  DollarSign, 
  Package, 
  ShoppingCart,
  Eye,
  Download,
  TrendingDown
} from 'lucide-react';

interface DashboardStatsProps {
  userId: string;
  period: '7d' | '30d' | '90d' | '1y';
}

interface Stats {
  totalRevenue: number;
  revenueChange: number;
  totalSales: number;
  salesChange: number;
  totalProducts: number;
  activeProducts: number;
  totalViews: number;
  viewsChange: number;
  totalDownloads: number;
  downloadsChange: number;
  conversionRate: number;
  conversionChange: number;
}

export default function DashboardStats({ userId, period }: DashboardStatsProps) {
  const [stats, setStats] = useState<Stats>({
    totalRevenue: 0,
    revenueChange: 0,
    totalSales: 0,
    salesChange: 0,
    totalProducts: 0,
    activeProducts: 0,
    totalViews: 0,
    viewsChange: 0,
    totalDownloads: 0,
    downloadsChange: 0,
    conversionRate: 0,
    conversionChange: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, [userId, period]);

  const loadStats = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/seller/stats?userId=${userId}&period=${period}`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Erreur chargement stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('fr-FR').format(num);
  };

  const getChangeIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (change < 0) return <TrendingDown className="h-4 w-4 text-red-500" />;
    return null;
  };

  const getChangeColor = (change: number) => {
    if (change > 0) return 'text-green-500';
    if (change < 0) return 'text-red-500';
    return 'text-zinc-400';
  };

  const statCards = [
    {
      title: 'Revenus totaux',
      value: formatCurrency(stats.totalRevenue),
      change: stats.revenueChange,
      icon: DollarSign,
      color: 'text-green-500'
    },
    {
      title: 'Ventes',
      value: formatNumber(stats.totalSales),
      change: stats.salesChange,
      icon: ShoppingCart,
      color: 'text-blue-500'
    },
    {
      title: 'Produits actifs',
      value: `${stats.activeProducts}/${stats.totalProducts}`,
      change: 0,
      icon: Package,
      color: 'text-purple-500'
    },
    {
      title: 'Vues',
      value: formatNumber(stats.totalViews),
      change: stats.viewsChange,
      icon: Eye,
      color: 'text-orange-500'
    },
    {
      title: 'Téléchargements',
      value: formatNumber(stats.totalDownloads),
      change: stats.downloadsChange,
      icon: Download,
      color: 'text-cyan-500'
    },
    {
      title: 'Taux de conversion',
      value: `${stats.conversionRate.toFixed(1)}%`,
      change: stats.conversionChange,
      icon: TrendingUp,
      color: 'text-pink-500'
    }
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="bg-zinc-800/50 border-zinc-700">
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-zinc-700 rounded w-1/3 mb-4"></div>
                <div className="h-8 bg-zinc-700 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-zinc-700 rounded w-1/4"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {statCards.map((stat, index) => {
        const IconComponent = stat.icon;
        return (
          <Card key={index} className="bg-zinc-800/50 border-zinc-700 hover:bg-zinc-800/70 transition-colors">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm text-zinc-400 mb-1">{stat.title}</p>
                  <p className="text-2xl font-bold text-white mb-2">{stat.value}</p>
                  
                  {stat.change !== 0 && (
                    <div className="flex items-center gap-1">
                      {getChangeIcon(stat.change)}
                      <span className={`text-sm ${getChangeColor(stat.change)}`}>
                        {stat.change > 0 ? '+' : ''}{stat.change.toFixed(1)}%
                      </span>
                      <span className="text-xs text-zinc-500">vs période précédente</span>
                    </div>
                  )}
                </div>
                
                <div className={`p-3 rounded-lg bg-zinc-700/50`}>
                  <IconComponent className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
