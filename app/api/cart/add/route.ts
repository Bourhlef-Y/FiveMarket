import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// POST - Ajouter un produit au panier
export async function POST(request: NextRequest) {
  try {
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
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // Récupérer les données de la requête
    const { resource_id, quantity = 1, price } = await request.json();
    
    if (!resource_id || !price) {
      return NextResponse.json({ error: 'Données manquantes' }, { status: 400 });
    }

    // Obtenir ou créer le panier de l'utilisateur
    let cartId;
    
    // Vérifier si l'utilisateur a déjà un panier
    const { data: existingCart, error: cartFindError } = await supabase
      .from('user_carts')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (existingCart) {
      cartId = existingCart.id;
    } else {
      // Créer un nouveau panier
      const { data: newCart, error: cartError } = await supabase
        .from('user_carts')
        .insert({ user_id: user.id })
        .select('id')
        .single();

      if (cartError) {
        console.error('Erreur création panier');
        return NextResponse.json({ error: 'Erreur création panier' }, { status: 500 });
      }
      
      cartId = newCart.id;
    }

    // Vérifier si l'utilisateur a déjà acheté ce produit
    const { data: existingOrder } = await supabase
      .from('orders')
      .select('id')
      .eq('buyer_id', user.id)
      .eq('resource_id', resource_id)
      .eq('status', 'completed')
      .single();

    if (existingOrder) {
      return NextResponse.json({ error: 'Vous avez déjà acheté ce produit.' }, { status: 400 });
    }

    // Vérifier si l'item existe déjà dans le panier
    const { data: existingItem } = await supabase
      .from('cart_items')
      .select('id, quantity')
      .eq('cart_id', cartId)
      .eq('resource_id', resource_id)
      .single();

    if (existingItem) {
      // Mettre à jour la quantité
      const { error: updateError } = await supabase
        .from('cart_items')
        .update({ quantity: existingItem.quantity + quantity })
        .eq('id', existingItem.id);

      if (updateError) {
        console.error('Erreur mise à jour quantité');
        return NextResponse.json({ error: 'Erreur mise à jour panier' }, { status: 500 });
      }
    } else {
      // Ajouter le nouvel item
      const { error: insertError } = await supabase
        .from('cart_items')
        .insert({
          cart_id: cartId,
          resource_id,
          quantity,
          price_at_time: price
        });

      if (insertError) {
        console.error('Erreur ajout item');
        return NextResponse.json({ error: 'Erreur ajout au panier' }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erreur inattendue ajout panier');
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}