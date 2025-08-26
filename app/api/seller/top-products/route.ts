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

    // Récupérer les commandes avec les détails des ressources
    const { data: orders } = await supabase
      .from('orders')
      .select(`
        amount,
        resource_id,
        resources (
          id,
          title,
          thumbnail_url,
          price,
          download_count
        )
      `)
      .eq('resources.author_id', userId)
      .eq('status', 'completed')
      .gte('created_at', startDate.toISOString());

    if (!orders) {
      return NextResponse.json([]);
    }

    // Grouper par ressource et calculer les métriques
    const productStats: { [key: string]: any } = {};
    
    orders.forEach(order => {
      const resource = order.resources;
      if (!resource) return;
      
      if (!productStats[resource.id]) {
        productStats[resource.id] = {
          id: resource.id,
          title: resource.title,
          thumbnail_url: resource.thumbnail_url,
          price: resource.price,
          downloads: resource.download_count || 0,
          revenue: 0,
          sales: 0,
          views: Math.floor(Math.random() * 1000) + 100 // Placeholder
        };
      }
      
      productStats[resource.id].revenue += order.amount;
      productStats[resource.id].sales += 1;
    });

    // Convertir en tableau et trier par revenus
    const topProducts = Object.values(productStats)
      .sort((a: any, b: any) => b.revenue - a.revenue)
      .slice(0, 10)
      .map((product: any, index: number) => ({
        ...product,
        rank: index + 1
      }));

    return NextResponse.json(topProducts);

  } catch (error) {
    console.error('Erreur lors du chargement des top produits:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
