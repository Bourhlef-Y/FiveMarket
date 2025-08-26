"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, TrendingUp, Eye, Download } from 'lucide-react';
import Image from 'next/image';

interface TopProductsProps {
  userId: string;
  period: '7d' | '30d' | '90d' | '1y';
}

interface TopProduct {
  id: string;
  title: string;
  thumbnail_url: string;
  revenue: number;
  sales: number;
  views: number;
  downloads: number;
  price: number;
  rank: number;
}

export default function TopProducts({ userId, period }: TopProductsProps) {
  const [products, setProducts] = useState<TopProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTopProducts();
  }, [userId, period]);

  const loadTopProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/seller/top-products?userId=${userId}&period=${period}`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setProducts(data);
      }
    } catch (error) {
      console.error('Erreur chargement top produits:', error);
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

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1: return 'text-yellow-500';
      case 2: return 'text-zinc-300';
      case 3: return 'text-amber-600';
      default: return 'text-zinc-500';
    }
  };

  const getRankIcon = (rank: number) => {
    if (rank <= 3) {
      return <Trophy className={`h-4 w-4 ${getRankColor(rank)}`} />;
    }
    return <span className="text-zinc-500 font-bold">#{rank}</span>;
  };

  if (loading) {
    return (
      <Card className="bg-zinc-800/50 border-zinc-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Top Produits
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="animate-pulse flex items-center gap-3">
              <div className="w-12 h-12 bg-zinc-700 rounded"></div>
              <div className="flex-1">
                <div className="h-4 bg-zinc-700 rounded mb-2"></div>
                <div className="h-3 bg-zinc-700 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-zinc-800/50 border-zinc-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Trophy className="h-5 w-5" />
          Top Produits
        </CardTitle>
      </CardHeader>
      <CardContent>
        {products.length === 0 ? (
          <div className="text-center py-8 text-zinc-400">
            <Trophy className="h-12 w-12 mx-auto mb-4 text-zinc-600" />
            <p>Aucun produit vendu sur cette période</p>
          </div>
        ) : (
          <div className="space-y-4">
            {products.map((product) => (
              <div key={product.id} className="flex items-center gap-3 p-3 rounded-lg bg-zinc-900/50 hover:bg-zinc-900/70 transition-colors">
                <div className="flex items-center justify-center w-8">
                  {getRankIcon(product.rank)}
                </div>
                
                <div className="relative w-12 h-12 rounded overflow-hidden flex-shrink-0">
                  <Image
                    src={product.thumbnail_url || '/placeholder.svg'}
                    alt={product.title}
                    fill
                    className="object-cover"
                  />
                </div>
                
                <div className="flex-1 min-w-0">
                  <h4 className="text-white font-medium truncate">{product.title}</h4>
                  <div className="flex items-center gap-4 text-xs text-zinc-400 mt-1">
                    <span className="flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      {formatCurrency(product.revenue)}
                    </span>
                    <span>{product.sales} ventes</span>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-[#FF7101] font-bold text-sm">
                    {formatCurrency(product.price)}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-zinc-400 mt-1">
                    <span className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      {product.views}
                    </span>
                    <span className="flex items-center gap-1">
                      <Download className="h-3 w-3" />
                      {product.downloads}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
