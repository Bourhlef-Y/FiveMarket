import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  console.log('API /api/seller/analytics GET appelée');
  try {
    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || '30d';

    // Créer le client Supabase
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            try {
              cookieStore.set({ name, value, ...options });
            } catch (error) {
              console.error('Erreur lors de la définition du cookie:', error);
            }
          },
          remove(name: string, options: any) {
            try {
              cookieStore.set({ name, value: '', ...options });
            } catch (error) {
              console.error('Erreur lors de la suppression du cookie:', error);
            }
          },
        },
      }
    );

    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // Vérifier le rôle
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || profile?.role !== 'seller') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    // Calculer les dates selon la plage
    const now = new Date();
    let startDate: Date;
    
    switch (range) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '1y':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // Récupérer les produits du vendeur
    const { data: products, error: productsError } = await supabase
      .from('resources')
      .select(`
        id,
        title,
        price,
        status,
        download_count,
        category,
        framework,
        created_at,
        updated_at
      `)
      .eq('author_id', user.id);

    if (productsError) {
      console.error('Erreur récupération produits:', productsError);
      throw productsError;
    }

    // Récupérer les commandes (simulation - en réalité il faudrait une vraie table des commandes)
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select(`
        id,
        resource_id,
        total_price,
        created_at,
        resources!inner (
          author_id
        )
      `)
      .eq('resources.author_id', user.id)
      .gte('created_at', startDate.toISOString());

    // Calculer les statistiques
    const totalProducts = products?.length || 0;
    const approvedProducts = products?.filter(p => p.status === 'approved').length || 0;
    const pendingProducts = products?.filter(p => p.status === 'pending').length || 0;
    const rejectedProducts = products?.filter(p => p.status === 'rejected').length || 0;

    const totalSales = products?.reduce((sum, p) => sum + (p.download_count || 0), 0) || 0;
    const totalRevenue = products?.reduce((sum, p) => sum + (p.price * (p.download_count || 0)), 0) || 0;

    // Calculer les revenus de la période
    const periodRevenue = orders?.reduce((sum, o) => sum + o.total_price, 0) || 0;
    const periodSales = orders?.length || 0;

    // Calculer les revenus mensuels (simulation)
    const monthlyRevenue = Math.floor(totalRevenue * 0.1); // 10% des revenus totaux ce mois
    const monthlySales = Math.floor(totalSales * 0.1); // 10% des ventes totales ce mois

    // Top produits
    const topProducts = products
      ?.filter(p => p.status === 'approved')
      .sort((a, b) => (b.download_count || 0) - (a.download_count || 0))
      .slice(0, 5)
      .map(p => ({
        id: p.id,
        title: p.title,
        sales: p.download_count || 0,
        revenue: p.price * (p.download_count || 0),
        downloads: p.download_count || 0
      })) || [];

    // Données mensuelles (simulation)
    const monthlyData = [
      { month: 'Jan', revenue: Math.floor(totalRevenue * 0.15), sales: Math.floor(totalSales * 0.15) },
      { month: 'Fév', revenue: Math.floor(totalRevenue * 0.18), sales: Math.floor(totalSales * 0.18) },
      { month: 'Mar', revenue: Math.floor(totalRevenue * 0.12), sales: Math.floor(totalSales * 0.12) },
      { month: 'Avr', revenue: Math.floor(totalRevenue * 0.20), sales: Math.floor(totalSales * 0.20) },
      { month: 'Mai', revenue: Math.floor(totalRevenue * 0.22), sales: Math.floor(totalSales * 0.22) },
      { month: 'Juin', revenue: Math.floor(totalRevenue * 0.13), sales: Math.floor(totalSales * 0.13) }
    ];

    // Données par catégorie
    const categoryData = products?.reduce((acc: any[], product) => {
      const existing = acc.find(cat => cat.category === product.category);
      if (existing) {
        existing.count += 1;
        existing.revenue += product.price * (product.download_count || 0);
      } else {
        acc.push({
          category: product.category,
          count: 1,
          revenue: product.price * (product.download_count || 0)
        });
      }
      return acc;
    }, []) || [];

    // Calculer les tendances (simulation)
    const revenueGrowth = 12.5; // +12.5%
    const salesGrowth = 8.3; // +8.3%
    const productGrowth = 25.0; // +25%

         const analyticsData = {
       revenue: {
         total: totalRevenue,
         monthly: monthlyRevenue,
         weekly: Math.floor(monthlyRevenue / 4),
         daily: Math.floor(monthlyRevenue / 30)
       },
       platformRevenue: {
         total: totalRevenue * 0.2, // 20% pour la plateforme
         monthly: monthlyRevenue * 0.2,
         weekly: Math.floor(monthlyRevenue / 4) * 0.2,
         daily: Math.floor(monthlyRevenue / 30) * 0.2
       },
      sales: {
        total: totalSales,
        monthly: monthlySales,
        weekly: Math.floor(monthlySales / 4),
        daily: Math.floor(monthlySales / 30)
      },
      products: {
        total: totalProducts,
        approved: approvedProducts,
        pending: pendingProducts,
        rejected: rejectedProducts
      },
      performance: {
        topProducts,
        monthlyData,
        categoryData
      },
      trends: {
        revenueGrowth,
        salesGrowth,
        productGrowth
      }
    };

    console.log('Analyses vendeur calculées:', analyticsData);

    return NextResponse.json(analyticsData);

  } catch (error: unknown) {
    console.error('Erreur API analyses vendeur:', error instanceof Error ? error.message : String(error));
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
