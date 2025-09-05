import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  console.log('API /api/account/purchases GET appelée');
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

    // Récupérer les commandes de l'utilisateur
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select(`
        id,
        resource_id,
        amount,
        status,
        created_at,
        resources!inner (
          id,
          title,
          description,
          price,
          category,
          framework,
          download_url,
          profiles!resources_author_id_fkey (
            username,
            avatar
          )
        )
      `)
      .eq('buyer_id', user.id)
      .order('created_at', { ascending: false });

    if (ordersError) {
      console.error('Erreur récupération commandes:', ordersError);
      throw ordersError;
    }

    // Transformer les données
    const transformedPurchases = orders?.map((order: any) => ({
      id: order.id,
      resource_id: order.resource_id,
      resource_title: order.resources?.title || 'Produit supprimé',
      resource_description: order.resources?.description || '',
      resource_price: order.resources?.price || 0,
      resource_category: order.resources?.category || 'Inconnue',
      resource_framework: order.resources?.framework || 'Inconnu',
      author_username: order.resources?.profiles?.username || 'Auteur inconnu',
      author_avatar: order.resources?.profiles?.avatar || null,
      total_price: order.amount,
      status: order.status,
      created_at: order.created_at,
      download_url: order.resources?.download_url || null
    })) || [];

    // Appliquer la pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    const paginatedPurchases = transformedPurchases.slice(from, to + 1);

    console.log('Achats utilisateur récupérés:', transformedPurchases.length);

    return NextResponse.json({
      purchases: paginatedPurchases,
      totalCount: transformedPurchases.length,
      currentPage: page,
      totalPages: Math.ceil(transformedPurchases.length / limit)
    });

  } catch (error: unknown) {
    console.error('Erreur API achats utilisateur:', error instanceof Error ? error.message : String(error));
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
