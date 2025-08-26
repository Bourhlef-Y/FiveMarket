import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId requis' }, { status: 400 });
    }

    // Récupérer les commandes récentes avec les détails
    const { data: orders } = await supabase
      .from('orders')
      .select(`
        id,
        amount,
        status,
        created_at,
        payment_intent_id,
        buyer_id,
        resources (
          title
        ),
        profiles!orders_buyer_id_fkey (
          username,
          avatar
        )
      `)
      .eq('resources.author_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (!orders) {
      return NextResponse.json([]);
    }

    // Formater les données
    const recentOrders = orders.map(order => ({
      id: order.id,
      buyer_name: order.profiles?.username || 'Utilisateur anonyme',
      buyer_avatar: order.profiles?.avatar || '',
      resource_title: order.resources?.title || 'Produit supprimé',
      amount: order.amount,
      status: order.status,
      created_at: order.created_at,
      payment_method: order.payment_intent_id ? 'Stripe' : 'Autre'
    }));

    return NextResponse.json(recentOrders);

  } catch (error) {
    console.error('Erreur lors du chargement des commandes récentes:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
