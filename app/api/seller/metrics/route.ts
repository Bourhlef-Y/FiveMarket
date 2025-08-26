import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const period = searchParams.get('period') || '30d';

    if (!userId) {
      return NextResponse.json({ error: 'userId requis' }, { status: 400 });
    }

    // Calculer les dates selon la période
    const now = new Date();
    let startDate = new Date();
    
    switch (period) {
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(now.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
    }

    // Récupérer les commandes de la période
    const { data: orders } = await supabase
      .from('orders')
      .select('amount, buyer_id, resources!inner(author_id)')
      .eq('resources.author_id', userId)
      .eq('status', 'completed')
      .gte('created_at', startDate.toISOString());

    // Récupérer tous les vendeurs pour calculer le rang
    const { data: allSellers } = await supabase
      .from('orders')
      .select('resources!inner(author_id), amount')
      .eq('status', 'completed')
      .gte('created_at', startDate.toISOString());

    // Calculer les métriques
    const totalRevenue = orders?.reduce((sum, order) => sum + order.amount, 0) || 0;
    const totalSales = orders?.length || 0;
    const averageOrderValue = totalSales > 0 ? totalRevenue / totalSales : 0;
    
    // Calculer les clients uniques et récurrents
    const uniqueBuyers = new Set(orders?.map(o => o.buyer_id)).size;
    const buyerCounts: { [key: string]: number } = {};
    orders?.forEach(order => {
      buyerCounts[order.buyer_id] = (buyerCounts[order.buyer_id] || 0) + 1;
    });
    const repeatCustomers = Object.values(buyerCounts).filter(count => count > 1).length;
    const repeatCustomerRate = uniqueBuyers > 0 ? (repeatCustomers / uniqueBuyers) * 100 : 0;

    // Calculer le rang marketplace
    const sellerRevenues: { [key: string]: number } = {};
    allSellers?.forEach(order => {
      const sellerId = order.resources.author_id;
      sellerRevenues[sellerId] = (sellerRevenues[sellerId] || 0) + order.amount;
    });
    
    const sortedSellers = Object.entries(sellerRevenues)
      .sort(([, a], [, b]) => b - a);
    const marketplaceRank = sortedSellers.findIndex(([sellerId]) => sellerId === userId) + 1;

    // Métriques simulées (à remplacer par de vraies données)
    const totalViews = Math.floor(Math.random() * 10000) + 1000;
    const conversionRate = totalViews > 0 ? (totalSales / totalViews) * 100 : 0;
    const customerSatisfaction = 4.2 + Math.random() * 0.6; // Entre 4.2 et 4.8
    
    // Score de performance basé sur plusieurs métriques
    const performanceScore = Math.min(100, Math.round(
      (conversionRate * 2) +
      (customerSatisfaction * 15) +
      (repeatCustomerRate * 0.5) +
      (Math.min(marketplaceRank <= 10 ? 20 : Math.max(0, 20 - marketplaceRank), 20))
    ));

    // Objectifs mensuels (à personnaliser selon les besoins)
    const monthlyRevenueGoal = 1000;
    const monthlySalesGoal = 50;
    
    // Calculer les progrès du mois en cours
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);
    
    const { data: monthlyOrders } = await supabase
      .from('orders')
      .select('amount, resources!inner(author_id)')
      .eq('resources.author_id', userId)
      .eq('status', 'completed')
      .gte('created_at', currentMonth.toISOString());

    const monthlyRevenue = monthlyOrders?.reduce((sum, order) => sum + order.amount, 0) || 0;
    const monthlySales = monthlyOrders?.length || 0;

    const metrics = {
      conversionRate,
      averageOrderValue,
      customerSatisfaction,
      repeatCustomerRate,
      marketplaceRank: marketplaceRank || 999,
      totalCustomers: uniqueBuyers,
      performanceScore,
      goals: {
        revenueGoal: monthlyRevenueGoal,
        revenueAchieved: monthlyRevenue,
        salesGoal: monthlySalesGoal,
        salesAchieved: monthlySales
      }
    };

    return NextResponse.json(metrics);

  } catch (error) {
    console.error('Erreur lors du chargement des métriques:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
