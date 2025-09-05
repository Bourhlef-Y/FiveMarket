import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  console.log('API /api/account/stats GET appelée');
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

    // Récupérer les commandes de l'utilisateur
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select(`
        id,
        total_price,
        created_at,
        resources!inner (
          id,
          title,
          category
        )
      `)
      .eq('user_id', user.id);

    if (ordersError) {
      console.error('Erreur récupération commandes:', ordersError);
      throw ordersError;
    }

    // Calculer les statistiques
    const totalPurchases = orders?.length || 0;
    const totalSpent = orders?.reduce((sum, order) => sum + order.total_price, 0) || 0;

    // Calculer les achats par catégorie
    const categoryStats = orders?.reduce((acc: any[], order) => {
      const category = order.resources?.category || 'Inconnue';
      const existing = acc.find(cat => cat.category === category);
      if (existing) {
        existing.count += 1;
        existing.total += order.total_price;
      } else {
        acc.push({
          category,
          count: 1,
          total: order.total_price
        });
      }
      return acc;
    }, []) || [];

    // Calculer les achats des 30 derniers jours
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentOrders = orders?.filter(order => 
      new Date(order.created_at) >= thirtyDaysAgo
    ) || [];

    const recentPurchases = recentOrders.length;
    const recentSpent = recentOrders.reduce((sum, order) => sum + order.total_price, 0);

    const stats = {
      totalPurchases,
      totalSpent,
      recentPurchases,
      recentSpent,
      categoryStats,
      memberSince: user.created_at
    };

    console.log('Statistiques utilisateur calculées:', stats);

    return NextResponse.json(stats);

  } catch (error: unknown) {
    console.error('Erreur API statistiques utilisateur:', error instanceof Error ? error.message : String(error));
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
