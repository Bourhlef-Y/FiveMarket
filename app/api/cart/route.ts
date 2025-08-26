import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createClient as createSupabaseServerClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

// GET - Récupérer le panier de l'utilisateur
export async function GET(request: NextRequest) {
  try {
    // Authentification robuste (Bearer token en priorité)
    let user = null;
    let supabase = null;
    
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const supabaseAdmin = createSupabaseServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );
      try {
        const { data: { user: tokenUser } } = await supabaseAdmin.auth.getUser(token);
        if (tokenUser) {
          user = tokenUser;
          supabase = supabaseAdmin;
        }
      } catch (tokenError) {
        console.error('Erreur validation token cart');
      }
    }

    // Fallback vers cookies si pas de Bearer token
    if (!user) {
      try {
        const cookieStore = cookies();
        const supabaseCookies = createRouteHandlerClient({ cookies: () => cookieStore });
        const { data: { user: cookieUser } } = await supabaseCookies.auth.getUser();
        if (cookieUser) {
          user = cookieUser;
          supabase = supabaseCookies;
        }
      } catch (cookieError) {
        console.error('Erreur cookies cart');
      }
    }

    if (!user || !supabase) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // Récupérer le panier avec les détails des ressources
    const { data: cartData, error: cartError } = await supabase
      .from('user_carts')
      .select(`
        id,
        cart_items (
          id,
          resource_id,
          quantity,
          price_at_time,
          resources (
            title,
            thumbnail_url,
            profiles!resources_author_id_fkey (username)
          )
        )
      `)
      .eq('user_id', user.id)
      .single();

    if (cartError && cartError.code !== 'PGRST116') {
      console.error('Erreur récupération panier');
      return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }

    // Formater les items du panier
    const items = cartData?.cart_items?.map((item: any) => ({
      id: item.id,
      resource_id: item.resource_id,
      resource_title: item.resources?.title || 'Produit supprimé',
      resource_thumbnail_url: item.resources?.thumbnail_url,
      author_username: item.resources?.profiles?.username,
      quantity: item.quantity,
      price_at_time: parseFloat(item.price_at_time),
      subtotal: item.quantity * parseFloat(item.price_at_time)
    })) || [];

    return NextResponse.json({ 
      success: true, 
      items 
    });
  } catch (error) {
    console.error('Erreur inattendue panier');
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}