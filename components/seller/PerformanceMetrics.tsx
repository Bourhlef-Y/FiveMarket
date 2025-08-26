"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { 
  Target, 
  TrendingUp, 
  Users, 
  Zap,
  Star,
  Award
} from 'lucide-react';

interface PerformanceMetricsProps {
  userId: string;
  period: '7d' | '30d' | '90d' | '1y';
}

interface Metrics {
  conversionRate: number;
  averageOrderValue: number;
  customerSatisfaction: number;
  repeatCustomerRate: number;
  marketplaceRank: number;
  totalCustomers: number;
  performanceScore: number;
  goals: {
    revenueGoal: number;
    revenueAchieved: number;
    salesGoal: number;
    salesAchieved: number;
  };
}

export default function PerformanceMetrics({ userId, period }: PerformanceMetricsProps) {
  const [metrics, setMetrics] = useState<Metrics>({
    conversionRate: 0,
    averageOrderValue: 0,
    customerSatisfaction: 0,
    repeatCustomerRate: 0,
    marketplaceRank: 0,
    totalCustomers: 0,
    performanceScore: 0,
    goals: {
      revenueGoal: 0,
      revenueAchieved: 0,
      salesGoal: 0,
      salesAchieved: 0
    }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMetrics();
  }, [userId, period]);

  const loadMetrics = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/seller/metrics?userId=${userId}&period=${period}`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setMetrics(data);
      }
    } catch (error) {
      console.error('Erreur chargement métriques:', error);
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

  const getPerformanceColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 100) return 'bg-green-500';
    if (percentage >= 75) return 'bg-yellow-500';
    return 'bg-[#FF7101]';
  };

  if (loading) {
    return (
      <Card className="bg-zinc-800/50 border-zinc-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Target className="h-5 w-5" />
            Métriques de performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 bg-zinc-700 rounded w-1/3"></div>
                <div className="h-2 bg-zinc-700 rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const revenueProgress = (metrics.goals.revenueAchieved / metrics.goals.revenueGoal) * 100;
  const salesProgress = (metrics.goals.salesAchieved / metrics.goals.salesGoal) * 100;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Objectifs */}
      <Card className="bg-zinc-800/50 border-zinc-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Target className="h-5 w-5" />
            Objectifs du mois
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-zinc-300">Revenus</span>
              <span className="text-sm text-zinc-400">
                {formatCurrency(metrics.goals.revenueAchieved)} / {formatCurrency(metrics.goals.revenueGoal)}
              </span>
            </div>
            <Progress 
              value={Math.min(revenueProgress, 100)} 
              className="h-2"
            />
            <div className="text-xs text-zinc-500 mt-1">
              {revenueProgress.toFixed(1)}% de l'objectif atteint
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-zinc-300">Ventes</span>
              <span className="text-sm text-zinc-400">
                {metrics.goals.salesAchieved} / {metrics.goals.salesGoal}
              </span>
            </div>
            <Progress 
              value={Math.min(salesProgress, 100)} 
              className="h-2"
            />
            <div className="text-xs text-zinc-500 mt-1">
              {salesProgress.toFixed(1)}% de l'objectif atteint
            </div>
          </div>

          <div className="pt-4 border-t border-zinc-700">
            <div className="flex items-center justify-between">
              <span className="text-zinc-300">Score de performance</span>
              <span className={`text-lg font-bold ${getPerformanceColor(metrics.performanceScore)}`}>
                {metrics.performanceScore}/100
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Métriques clés */}
      <Card className="bg-zinc-800/50 border-zinc-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Métriques clés
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-zinc-900/50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="h-4 w-4 text-yellow-500" />
                <span className="text-sm text-zinc-400">Conversion</span>
              </div>
              <div className="text-xl font-bold text-white">
                {metrics.conversionRate.toFixed(1)}%
              </div>
            </div>

            <div className="p-4 bg-zinc-900/50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <span className="text-sm text-zinc-400">Panier moyen</span>
              </div>
              <div className="text-xl font-bold text-white">
                {formatCurrency(metrics.averageOrderValue)}
              </div>
            </div>

            <div className="p-4 bg-zinc-900/50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Star className="h-4 w-4 text-orange-500" />
                <span className="text-sm text-zinc-400">Satisfaction</span>
              </div>
              <div className="text-xl font-bold text-white">
                {metrics.customerSatisfaction.toFixed(1)}/5
              </div>
            </div>

            <div className="p-4 bg-zinc-900/50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-4 w-4 text-blue-500" />
                <span className="text-sm text-zinc-400">Clients fidèles</span>
              </div>
              <div className="text-xl font-bold text-white">
                {metrics.repeatCustomerRate.toFixed(1)}%
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-zinc-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="h-4 w-4 text-purple-500" />
                <span className="text-zinc-300">Rang marketplace</span>
              </div>
              <span className="text-lg font-bold text-white">
                #{metrics.marketplaceRank}
              </span>
            </div>
            <div className="text-xs text-zinc-500 mt-1">
              Basé sur les ventes et les avis
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
