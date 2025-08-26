"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ShoppingCart, Clock, CheckCircle, XCircle } from 'lucide-react';

interface RecentOrdersProps {
  userId: string;
}

interface Order {
  id: string;
  buyer_name: string;
  buyer_avatar: string;
  resource_title: string;
  amount: number;
  status: 'pending' | 'completed' | 'cancelled';
  created_at: string;
  payment_method?: string;
}

export default function RecentOrders({ userId }: RecentOrdersProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecentOrders();
  }, [userId]);

  const loadRecentOrders = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/seller/recent-orders?userId=${userId}`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setOrders(data);
      }
    } catch (error) {
      console.error('Erreur chargement commandes:', error);
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
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffMinutes < 60) {
      return `Il y a ${diffMinutes} min`;
    } else if (diffHours < 24) {
      return `Il y a ${diffHours}h`;
    } else if (diffDays < 7) {
      return `Il y a ${diffDays}j`;
    } else {
      return date.toLocaleDateString('fr-FR');
    }
  };

  const getStatusBadge = (status: Order['status']) => {
    switch (status) {
      case 'completed':
        return (
          <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
            <CheckCircle className="h-3 w-3 mr-1" />
            Terminée
          </Badge>
        );
      case 'pending':
        return (
          <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
            <Clock className="h-3 w-3 mr-1" />
            En attente
          </Badge>
        );
      case 'cancelled':
        return (
          <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
            <XCircle className="h-3 w-3 mr-1" />
            Annulée
          </Badge>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <Card className="bg-zinc-800/50 border-zinc-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Commandes récentes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="animate-pulse flex items-center gap-3">
              <div className="w-10 h-10 bg-zinc-700 rounded-full"></div>
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
          <ShoppingCart className="h-5 w-5" />
          Commandes récentes
        </CardTitle>
      </CardHeader>
      <CardContent>
        {orders.length === 0 ? (
          <div className="text-center py-8 text-zinc-400">
            <ShoppingCart className="h-12 w-12 mx-auto mb-4 text-zinc-600" />
            <p>Aucune commande récente</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="flex items-center gap-3 p-3 rounded-lg bg-zinc-900/50 hover:bg-zinc-900/70 transition-colors">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={order.buyer_avatar} alt={order.buyer_name} />
                  <AvatarFallback>{order.buyer_name?.charAt(0)}</AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-white font-medium truncate">{order.buyer_name}</span>
                    {getStatusBadge(order.status)}
                  </div>
                  <p className="text-zinc-400 text-sm truncate">{order.resource_title}</p>
                  <p className="text-zinc-500 text-xs">{formatDate(order.created_at)}</p>
                </div>
                
                <div className="text-right">
                  <div className="text-[#FF7101] font-bold">
                    {formatCurrency(order.amount)}
                  </div>
                  {order.payment_method && (
                    <div className="text-xs text-zinc-500 mt-1">
                      {order.payment_method}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
