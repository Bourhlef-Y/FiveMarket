"use client";

import { useState, useEffect } from 'react';

interface RevenueChartProps {
  userId: string;
  period: '7d' | '30d' | '90d' | '1y';
}

interface ChartData {
  date: string;
  revenue: number;
  sales: number;
}

export default function RevenueChart({ userId, period }: RevenueChartProps) {
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadChartData();
  }, [userId, period]);

  const loadChartData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/seller/revenue-chart?userId=${userId}&period=${period}`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setChartData(data);
      }
    } catch (error) {
      console.error('Erreur chargement graphique:', error);
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

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', { 
      day: '2-digit', 
      month: '2-digit' 
    });
  };

  if (loading) {
    return (
      <div className="h-80 flex items-center justify-center">
        <div className="animate-pulse flex space-x-4 w-full">
          <div className="flex-1 space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-8 bg-zinc-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const maxRevenue = Math.max(...chartData.map(d => d.revenue), 1);

  return (
    <div className="h-80">
      {chartData.length === 0 ? (
        <div className="h-full flex items-center justify-center text-zinc-400">
          <div className="text-center">
            <div className="text-4xl mb-4">📊</div>
            <p>Aucune donnée disponible pour cette période</p>
          </div>
        </div>
      ) : (
        <div className="h-full flex flex-col">
          {/* Graphique simple en barres */}
          <div className="flex-1 flex items-end justify-between gap-2 px-4">
            {chartData.map((data, index) => (
              <div key={index} className="flex-1 flex flex-col items-center group">
                <div className="relative flex-1 flex items-end w-full">
                  <div 
                    className="w-full bg-gradient-to-t from-[#FF7101] to-[#FF7101]/60 rounded-t-sm transition-all hover:from-[#FF7101]/80 hover:to-[#FF7101]/40 cursor-pointer relative"
                    style={{
                      height: `${(data.revenue / maxRevenue) * 100}%`,
                      minHeight: data.revenue > 0 ? '8px' : '2px'
                    }}
                  >
                    {/* Tooltip */}
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-zinc-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap z-10">
                      <div className="font-medium">{formatCurrency(data.revenue)}</div>
                      <div className="text-zinc-400">{data.sales} vente(s)</div>
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-l-4 border-r-4 border-t-4 border-transparent border-t-zinc-800"></div>
                    </div>
                  </div>
                </div>
                
                <div className="text-xs text-zinc-400 mt-2 transform -rotate-45 origin-center">
                  {formatDate(data.date)}
                </div>
              </div>
            ))}
          </div>

          {/* Légende */}
          <div className="flex justify-center items-center gap-6 mt-6 pt-4 border-t border-zinc-700">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-[#FF7101] rounded"></div>
              <span className="text-sm text-zinc-400">Revenus</span>
            </div>
            <div className="text-sm text-zinc-500">
              Total: {formatCurrency(chartData.reduce((sum, d) => sum + d.revenue, 0))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
