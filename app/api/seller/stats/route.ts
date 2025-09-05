import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  console.log('API /api/seller/stats GET appelée');
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

    // Vérifier le rôle
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || profile?.role !== 'seller') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    // Récupérer les statistiques des produits
    const { data: products, error: productsError } = await supabase
      .from('resources')
      .select('status, price, download_count')
      .eq('author_id', user.id);

    if (productsError) {
      console.error('Erreur récupération produits:', productsError);
      throw productsError;
    }

    // Récupérer les commandes
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('total_price, created_at')
      .eq('resource_id', supabase.from('resources').select('id').eq('author_id', user.id));

    // Calculer les statistiques
    const totalProducts = products?.length || 0;
    const approvedProducts = products?.filter(p => p.status === 'approved').length || 0;
    const pendingProducts = products?.filter(p => p.status === 'pending').length || 0;
    const rejectedProducts = products?.filter(p => p.status === 'rejected').length || 0;
    
    const totalSales = products?.reduce((sum, p) => sum + (p.download_count || 0), 0) || 0;
    const totalRevenue = products?.reduce((sum, p) => sum + (p.price * (p.download_count || 0)), 0) || 0;

    // Calculer les revenus du mois en cours
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);
    
    const monthlyRevenue = products?.reduce((sum, p) => {
      // Simulation des ventes du mois (en réalité, il faudrait une table des ventes)
      const monthlyDownloads = Math.floor((p.download_count || 0) * 0.1); // 10% des téléchargements ce mois
      return sum + (p.price * monthlyDownloads);
    }, 0) || 0;

    const monthlySales = Math.floor(totalSales * 0.1); // 10% des ventes ce mois

    // Récupérer les commandes en attente (simulation)
    const pendingOrders = 0; // À implémenter avec une vraie table des commandes

    const stats = {
      totalProducts,
      totalSales,
      totalRevenue,
      pendingOrders,
      approvedProducts,
      pendingProducts,
      rejectedProducts,
      monthlyRevenue,
      monthlySales,
      platformRevenue: {
        total: totalRevenue * 0.2, // 20% pour la plateforme
        monthly: monthlyRevenue * 0.2
      }
    };

    console.log('Statistiques vendeur calculées:', stats);

    return NextResponse.json(stats);

  } catch (error: unknown) {
    console.error('Erreur API statistiques vendeur:', error instanceof Error ? error.message : String(error));
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}