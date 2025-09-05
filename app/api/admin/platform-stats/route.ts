import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  console.log('API /api/admin/platform-stats GET appelée');
  try {
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

    // Vérifier le rôle admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    // Récupérer toutes les commandes
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select(`
        id,
        amount,
        created_at,
        status
      `);

    if (ordersError) {
      console.error('Erreur récupération commandes:', ordersError);
      throw ordersError;
    }

    // Récupérer tous les produits
    const { data: products, error: productsError } = await supabase
      .from('resources')
      .select(`
        id,
        price,
        status,
        download_count,
        created_at
      `);

    if (productsError) {
      console.error('Erreur récupération produits:', productsError);
      throw productsError;
    }

    // Récupérer tous les utilisateurs
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select(`
        id,
        role,
        created_at
      `);

    if (usersError) {
      console.error('Erreur récupération utilisateurs:', usersError);
      throw usersError;
    }

    // Calculer les statistiques globales
    const totalOrders = orders?.length || 0;
    const totalRevenue = orders?.reduce((sum, order) => sum + order.amount, 0) || 0;
    const platformRevenue = totalRevenue * 0.2; // 20% pour la plateforme

    // Calculer les revenus par mois
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);
    
    const monthlyOrders = orders?.filter(order => 
      new Date(order.created_at) >= currentMonth
    ) || [];
    
    const monthlyRevenue = monthlyOrders.reduce((sum, order) => sum + order.amount, 0);
    const monthlyPlatformRevenue = monthlyRevenue * 0.2;

    // Statistiques des produits
    const totalProducts = products?.length || 0;
    const approvedProducts = products?.filter(p => p.status === 'approved').length || 0;
    const pendingProducts = products?.filter(p => p.status === 'pending').length || 0;

    // Statistiques des utilisateurs
    const totalUsers = users?.length || 0;
    const totalSellers = users?.filter(u => u.role === 'seller').length || 0;
    const totalAdmins = users?.filter(u => u.role === 'admin').length || 0;

    // Calculer les revenus des 6 derniers mois
    const monthlyData = [];
    for (let i = 5; i >= 0; i--) {
      const month = new Date();
      month.setMonth(month.getMonth() - i);
      month.setDate(1);
      month.setHours(0, 0, 0, 0);
      
      const nextMonth = new Date(month);
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      
      const monthOrders = orders?.filter(order => {
        const orderDate = new Date(order.created_at);
        return orderDate >= month && orderDate < nextMonth;
      }) || [];
      
      const monthRevenue = monthOrders.reduce((sum, order) => sum + order.amount, 0);
      
      monthlyData.push({
        month: month.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' }),
        revenue: monthRevenue,
                 platformRevenue: monthRevenue * 0.2,
        orders: monthOrders.length
      });
    }

    const stats = {
      revenue: {
        total: totalRevenue,
        monthly: monthlyRevenue,
        platform: {
          total: platformRevenue,
          monthly: monthlyPlatformRevenue
        }
      },
      orders: {
        total: totalOrders,
        monthly: monthlyOrders.length
      },
      products: {
        total: totalProducts,
        approved: approvedProducts,
        pending: pendingProducts
      },
      users: {
        total: totalUsers,
        sellers: totalSellers,
        admins: totalAdmins
      },
      monthlyData
    };

    console.log('Statistiques plateforme calculées:', stats);

    return NextResponse.json(stats);

  } catch (error: unknown) {
    console.error('Erreur API statistiques plateforme:', error instanceof Error ? error.message : String(error));
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
