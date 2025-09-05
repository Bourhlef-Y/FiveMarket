import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

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

    // Récupérer la commande
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        id,
        amount,
        status,
        paid_at,
        created_at,
        resource_id
      `)
      .eq('id', id)
      .eq('buyer_id', user.id)
      .single();

    if (orderError || !order) {
      console.error('Erreur récupération commande:', orderError);
      return NextResponse.json({ error: 'Commande non trouvée' }, { status: 404 });
    }

    // Récupérer les détails du produit séparément
    const { data: product, error: productError } = await supabase
      .from('resources')
      .select(`
        id,
        title,
        price,
        images,
        resource_type
      `)
      .eq('id', order.resource_id)
      .single();

    if (productError || !product) {
      console.error('Erreur récupération produit:', productError);
      return NextResponse.json({ error: 'Produit non trouvé' }, { status: 404 });
    }

    // Combiner les données
    const orderWithProduct = {
      ...order,
      resources: product
    };

    console.log('Commande récupérée:', {
      id: orderWithProduct.id,
      resource_type: orderWithProduct.resources?.resource_type,
      title: orderWithProduct.resources?.title
    });

    // Formater la réponse
    const formattedOrder = {
      id: orderWithProduct.id,
      amount: orderWithProduct.amount,
      status: orderWithProduct.status,
      paid_at: orderWithProduct.paid_at,
      created_at: orderWithProduct.created_at,
      product: {
        id: orderWithProduct.resources.id,
        title: orderWithProduct.resources.title,
        price: orderWithProduct.resources.price,
        images: orderWithProduct.resources.images,
        resource_type: orderWithProduct.resources.resource_type
      }
    };

    return NextResponse.json(formattedOrder);

  } catch (error) {
    console.error('Erreur API commande:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
