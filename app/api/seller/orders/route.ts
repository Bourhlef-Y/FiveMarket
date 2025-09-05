import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  console.log('API /api/seller/orders GET appelée');
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

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

    // Récupérer les commandes pour les produits du vendeur
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select(`
        id,
        buyer_id,
        resource_id,
        amount,
        status,
        created_at,
        resources!inner (
          title,
          author_id
        ),
        profiles!orders_buyer_id_fkey (
          username
        )
      `)
      .eq('resources.author_id', user.id)
      .order('created_at', { ascending: false });

    if (ordersError) {
      console.error('Erreur récupération commandes:', ordersError);
      throw ordersError;
    }

    // Transformer les données
    const transformedOrders = orders?.map((order: any) => ({
      id: order.id,
      resource_id: order.resource_id,
      user_id: order.buyer_id,
      total_price: order.amount,
      status: order.status,
      created_at: order.created_at,
      resource_title: order.resources?.title || 'Produit supprimé',
      buyer_username: order.profiles?.username || 'Utilisateur inconnu'
    })) || [];

    // Appliquer la pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    const paginatedOrders = transformedOrders.slice(from, to + 1);

    console.log('Commandes vendeur récupérées:', transformedOrders.length);

    return NextResponse.json({
      orders: paginatedOrders,
      totalCount: transformedOrders.length,
      currentPage: page,
      totalPages: Math.ceil(transformedOrders.length / limit)
    });

  } catch (error: unknown) {
    console.error('Erreur API commandes vendeur:', error instanceof Error ? error.message : String(error));
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
