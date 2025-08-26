import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function DELETE(request: Request) {
  try {
    // Attendre les cookies
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // Créer un client admin avec service role
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    // 1. Supprimer d'abord les ressources de l'utilisateur
    const { error: resourcesError } = await supabase
      .from('resources')
      .delete()
      .eq('author_id', user.id);

    if (resourcesError) {
      throw resourcesError;
    }

    // 2. Supprimer les demandes vendeur
    const { error: requestsError } = await supabase
      .from('seller_requests')
      .delete()
      .eq('user_id', user.id);

    if (requestsError) {
      throw requestsError;
    }

    // 3. Supprimer le panier
    const { data: cart } = await supabase
      .from('user_carts')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (cart) {
      // Supprimer d'abord les items du panier
      await supabase
        .from('cart_items')
        .delete()
        .eq('cart_id', cart.id);

      // Puis supprimer le panier
      await supabase
        .from('user_carts')
        .delete()
        .eq('id', cart.id);
    }

    // 4. Supprimer le profil
    const { error: deleteError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', user.id);

    if (deleteError) {
      throw deleteError;
    }

    // 5. Supprimer le compte auth avec le client admin
    const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(
      user.id
    );

    if (authDeleteError) {
      throw authDeleteError;
    }

    // 6. Déconnecter l'utilisateur
    await supabase.auth.signOut();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erreur suppression compte:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la suppression du compte' },
      { status: 500 }
    );
  }
}