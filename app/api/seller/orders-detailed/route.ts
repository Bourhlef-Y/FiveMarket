import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
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

    console.log('Recherche des commandes pour le vendeur:', user.id);

    // D'abord, récupérer les ressources du vendeur
    const { data: sellerResources, error: resourcesError } = await supabase
      .from('resources')
      .select('id')
      .eq('author_id', user.id);

    console.log('Ressources du vendeur:', sellerResources);

    if (resourcesError) {
      console.error('Erreur récupération ressources:', resourcesError);
      return NextResponse.json({ error: 'Erreur lors de la récupération des ressources' }, { status: 500 });
    }

    if (!sellerResources || sellerResources.length === 0) {
      console.log('Aucune ressource trouvée pour ce vendeur');
      return NextResponse.json({ success: true, orders: [] });
    }

    const resourceIds = sellerResources.map(r => r.id);

    // D'abord, tester une requête simple sans jointures
    const { data: simpleOrders, error: simpleError } = await supabase
      .from('orders')
      .select('id, amount, status, created_at, buyer_id, resource_id')
      .in('resource_id', resourceIds)
      .order('created_at', { ascending: false });

    console.log('Requête simple - commandes:', simpleOrders);
    console.log('Requête simple - erreur:', simpleError);

    // Tester une requête encore plus simple - toutes les commandes
    const { data: allOrders, error: allOrdersError } = await supabase
      .from('orders')
      .select('id, amount, status, created_at, buyer_id, resource_id')
      .order('created_at', { ascending: false })
      .limit(5);

    console.log('Toutes les commandes (limite 5):', allOrders);
    console.log('Erreur toutes les commandes:', allOrdersError);

    // Récupérer les commandes pour ces ressources
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select(`
        id,
        amount,
        status,
        created_at,
        paid_at,
        buyer_id,
        resource_id,
        profiles!orders_buyer_id_fkey (
          id,
          username,
          auth_email
        ),
        resources!orders_resource_id_fkey (
          id,
          title,
          resource_type,
          author_id
        )
      `)
      .in('resource_id', resourceIds)
      .order('created_at', { ascending: false });

    console.log('Résultat de la requête commandes:', { orders, ordersError });

    if (ordersError) {
      console.error('Erreur récupération commandes:', ordersError);
      return NextResponse.json({ error: 'Erreur lors de la récupération des commandes' }, { status: 500 });
    }

    // Récupérer les informations escrow pour les commandes escrow
    const escrowOrderIds = orders
      ?.filter(order => order.resources?.resource_type === 'escrow')
      .map(order => order.id) || [];

    let escrowInfoMap: Record<string, any> = {};
    
    if (escrowOrderIds.length > 0) {
      const { data: escrowInfo, error: escrowError } = await supabase
        .from('order_escrow_info')
        .select('order_id, cfx_id, email, username, submitted_at')
        .in('order_id', escrowOrderIds);

      if (!escrowError && escrowInfo) {
        escrowInfoMap = escrowInfo.reduce((acc, info) => {
          acc[info.order_id] = info;
          return acc;
        }, {} as Record<string, any>);
      }
    }

    // Formater les données
    const formattedOrders = orders?.map(order => ({
      id: order.id,
      amount: order.amount,
      status: order.status,
      created_at: order.created_at,
      paid_at: order.paid_at,
      buyer: {
        id: order.profiles?.id,
        username: order.profiles?.username,
        auth_email: order.profiles?.auth_email
      },
      resource: {
        id: order.resources?.id,
        title: order.resources?.title,
        resource_type: order.resources?.resource_type
      },
      escrow_info: escrowInfoMap[order.id] || null
    })) || [];

    return NextResponse.json({
      success: true,
      orders: formattedOrders
    });

  } catch (error) {
    console.error('Erreur API commandes vendeur:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
