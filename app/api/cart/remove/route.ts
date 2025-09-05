import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// DELETE - Supprimer un item du panier
export async function DELETE(request: NextRequest) {
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

    // Récupérer l'ID de l'item à supprimer
    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get('itemId');
    
    if (!itemId) {
      return NextResponse.json({ error: 'ID item manquant' }, { status: 400 });
    }

    console.log('Tentative de suppression de l\'item:', itemId, 'pour l\'utilisateur:', user.id);

    // D'abord, récupérer le panier de l'utilisateur
    const { data: userCart, error: cartError } = await supabase
      .from('user_carts')
      .select('id')
      .eq('user_id', user.id)
      .single();

    console.log('Panier de l\'utilisateur:', { userCart, cartError });

    if (cartError || !userCart) {
      console.log('Panier non trouvé:', cartError);
      return NextResponse.json({ error: 'Panier non trouvé' }, { status: 404 });
    }

    // Vérifier que l'item appartient bien au panier de l'utilisateur
    const { data: cartItem, error: findError } = await supabase
      .from('cart_items')
      .select('id, cart_id, resource_id')
      .eq('id', itemId)
      .eq('cart_id', userCart.id)
      .single();

    console.log('Résultat de la recherche de l\'item:', { cartItem, findError });

    if (findError || !cartItem) {
      console.log('Item non trouvé ou erreur:', findError);
      return NextResponse.json({ error: 'Item non trouvé' }, { status: 404 });
    }

    // Supprimer l'item
    console.log('Suppression de l\'item:', itemId);
    const { error: deleteError } = await supabase
      .from('cart_items')
      .delete()
      .eq('id', itemId);

    console.log('Résultat de la suppression:', { deleteError });

    if (deleteError) {
      console.error('Erreur suppression item:', deleteError);
      return NextResponse.json({ error: 'Erreur suppression' }, { status: 500 });
    }

    console.log('Item supprimé avec succès');
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erreur inattendue suppression item');
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}