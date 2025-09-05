import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// GET - Récupérer le panier de l'utilisateur
export async function GET(request: NextRequest) {
  try {
    let user = null;
    let supabase = null;

    // 1. Vérifier si Bearer token dans les headers
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);

      const supabaseAdmin = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
          cookies: {
            get: () => null,
            set: () => {},
            remove: () => {}
          }
        }
      );

      try {
        const { data: { user: tokenUser } } = await supabaseAdmin.auth.getUser(token);
        if (tokenUser) {
          user = tokenUser;
          supabase = supabaseAdmin;
        }
      } catch (e) {
        console.error('Erreur validation token cart', e);
      }
    }

    // 2. Fallback sur cookies si pas de Bearer token
    if (!user) {
      const cookieStore = await cookies();

      const supabaseCookies = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            get: (name) => cookieStore.get(name)?.value,
            set: () => {},   // obligatoire mais inutile côté serverless
            remove: () => {}
          }
        }
      );

      const { data: { user: cookieUser } } = await supabaseCookies.auth.getUser();
      if (cookieUser) {
        user = cookieUser;
        supabase = supabaseCookies;
      }
    }

    if (!user || !supabase) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // 3. Récupérer le panier
    const { data: cartItemsData, error: cartError } = await supabase
      .from('cart_items')
      .select(`
        id,
        resource_id,
        quantity,
        price_at_time,
        user_carts!inner (
          user_id
        ),
        resources (
          title,
          thumbnail,
          profiles:author_id (username, avatar)
        )
      `)
      .eq('user_carts.user_id', user.id);

    if (cartError) {
      console.error('Erreur récupération panier:', cartError.message || cartError);
      return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }

    const items = cartItemsData?.map((item: any) => ({
      id: item.id,
      resource_id: item.resource_id,
      resource_title: item.resources?.title || 'Produit supprimé',
      resource_thumbnail_url: item.resources?.thumbnail,
      author_username: item.resources?.profiles?.username,
      quantity: item.quantity,
      price_at_time: parseFloat(item.price_at_time),
      subtotal: item.quantity * parseFloat(item.price_at_time)
    })) || [];

    return NextResponse.json({ success: true, items });
  } catch (error) {
    console.error('Erreur inattendue panier', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
