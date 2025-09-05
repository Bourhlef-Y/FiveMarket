import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { productId, cfx_id, email, username } = body;

    if (!productId) {
      return NextResponse.json({ error: 'ID du produit requis' }, { status: 400 });
    }

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

    // Vérifier que l'utilisateur a bien acheté ce produit
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, status')
      .eq('buyer_id', user.id)
      .eq('resource_id', productId)
      .eq('status', 'completed')
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: 'Commande non trouvée' }, { status: 404 });
    }

    // Vérifier que le produit est bien escrow
    const { data: product, error: productError } = await supabase
      .from('resources')
      .select('id, resource_type')
      .eq('id', productId)
      .eq('resource_type', 'escrow')
      .single();

    if (productError || !product) {
      return NextResponse.json({ error: 'Produit non escrow' }, { status: 400 });
    }

    // Créer ou mettre à jour les informations escrow
    const { error: escrowError } = await supabase
      .from('order_escrow_info')
      .upsert({
        order_id: order.id,
        buyer_id: user.id,
        resource_id: productId,
        cfx_id: cfx_id || null,
        email: email || null,
        username: username || null,
        submitted_at: new Date().toISOString()
      });

    if (escrowError) {
      console.error('Erreur création escrow info:', escrowError);
      return NextResponse.json({ error: 'Erreur lors de l\'enregistrement des informations' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Informations escrow enregistrées avec succès'
    });

  } catch (error) {
    console.error('Erreur API escrow:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
