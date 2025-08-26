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
    let previousStartDate = new Date();
    
    switch (period) {
      case '7d':
        startDate.setDate(now.getDate() - 7);
        previousStartDate.setDate(now.getDate() - 14);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        previousStartDate.setDate(now.getDate() - 60);
        break;
      case '90d':
        startDate.setDate(now.getDate() - 90);
        previousStartDate.setDate(now.getDate() - 180);
        break;
      case '1y':
        startDate.setFullYear(now.getFullYear() - 1);
        previousStartDate.setFullYear(now.getFullYear() - 2);
        break;
    }

    // Récupérer les commandes de la période actuelle
    const { data: currentOrders } = await supabase
      .from('orders')
      .select('amount, created_at, resource_id, resources!inner(author_id)')
      .eq('resources.author_id', userId)
      .eq('status', 'completed')
      .gte('created_at', startDate.toISOString());

    // Récupérer les commandes de la période précédente
    const { data: previousOrders } = await supabase
      .from('orders')
      .select('amount, created_at')
      .eq('resources.author_id', userId)
      .eq('status', 'completed')
      .gte('created_at', previousStartDate.toISOString())
      .lt('created_at', startDate.toISOString());

    // Récupérer les produits
    const { data: products } = await supabase
      .from('resources')
      .select('id, status, download_count')
      .eq('author_id', userId);

    // Calculer les statistiques actuelles
    const totalRevenue = currentOrders?.reduce((sum, order) => sum + order.amount, 0) || 0;
    const totalSales = currentOrders?.length || 0;
    const totalProducts = products?.length || 0;
    const activeProducts = products?.filter(p => p.status === 'approved').length || 0;
    const totalViews = Math.floor(Math.random() * 10000) + 1000; // Placeholder
    const totalDownloads = products?.reduce((sum, p) => sum + (p.download_count || 0), 0) || 0;

    // Calculer les statistiques précédentes
    const previousRevenue = previousOrders?.reduce((sum, order) => sum + order.amount, 0) || 0;
    const previousSales = previousOrders?.length || 0;
    const previousViews = Math.floor(Math.random() * 8000) + 800; // Placeholder
    const previousDownloads = totalDownloads * 0.8; // Placeholder

    // Calculer les changements en pourcentage
    const revenueChange = previousRevenue > 0 ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 : 0;
    const salesChange = previousSales > 0 ? ((totalSales - previousSales) / previousSales) * 100 : 0;
    const viewsChange = previousViews > 0 ? ((totalViews - previousViews) / previousViews) * 100 : 0;
    const downloadsChange = previousDownloads > 0 ? ((totalDownloads - previousDownloads) / previousDownloads) * 100 : 0;

    // Calculer le taux de conversion
    const conversionRate = totalViews > 0 ? (totalSales / totalViews) * 100 : 0;
    const previousConversionRate = previousViews > 0 ? (previousSales / previousViews) * 100 : 0;
    const conversionChange = previousConversionRate > 0 ? ((conversionRate - previousConversionRate) / previousConversionRate) * 100 : 0;

    const stats = {
      totalRevenue,
      revenueChange,
      totalSales,
      salesChange,
      totalProducts,
      activeProducts,
      totalViews,
      viewsChange,
      totalDownloads,
      downloadsChange,
      conversionRate,
      conversionChange
    };

    return NextResponse.json(stats);

  } catch (error) {
    console.error('Erreur lors du chargement des stats:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
