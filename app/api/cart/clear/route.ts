import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// DELETE - Vider le panier
export async function DELETE(request: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // Récupérer le panier de l'utilisateur
    const { data: cart, error: cartError } = await supabase
      .from('user_carts')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (cartError) {
      return NextResponse.json({ error: 'Panier non trouvé' }, { status: 404 });
    }

    // Supprimer tous les items du panier
    const { error: deleteError } = await supabase
      .from('cart_items')
      .delete()
      .eq('cart_id', cart.id);

    if (deleteError) {
      console.error('Erreur vidage panier');
      return NextResponse.json({ error: 'Erreur vidage panier' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erreur inattendue vidage panier');
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}