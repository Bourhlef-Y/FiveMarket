import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { productId, quantity = 1, cfxId } = body;

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

    // Récupérer les détails du produit
    const { data: product, error: productError } = await supabase
      .from('resources')
      .select('id, title, price, author_id, status, download_count, resource_type')
      .eq('id', productId)
      .eq('status', 'approved')
      .single();

    if (productError || !product) {
      return NextResponse.json({ error: 'Produit non trouvé ou non approuvé' }, { status: 404 });
    }

    // Vérifier que l'utilisateur n'achète pas son propre produit
    if (product.author_id === user.id) {
      return NextResponse.json({ error: 'Vous ne pouvez pas acheter votre propre produit' }, { status: 400 });
    }

    // Vérifier que l'utilisateur n'a pas déjà acheté ce produit
    const { data: existingOrder, error: existingOrderError } = await supabase
      .from('orders')
      .select('id')
      .eq('buyer_id', user.id)
      .eq('resource_id', productId)
      .eq('status', 'completed')
      .single();

    if (existingOrderError && existingOrderError.code !== 'PGRST116') {
      console.error('Erreur vérification commande existante:', existingOrderError);
      return NextResponse.json({ error: 'Erreur lors de la vérification des commandes existantes' }, { status: 500 });
    }

    if (existingOrder) {
      return NextResponse.json({ error: 'Vous avez déjà acheté ce produit' }, { status: 400 });
    }

    // Calculer le total
    const total = product.price * quantity;

    // Créer la commande
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        buyer_id: user.id,
        resource_id: productId,
        amount: total,
        status: 'completed', // Pour le dev, on accepte automatiquement
        paid_at: new Date().toISOString()
      })
      .select()
      .single();

    if (orderError) {
      console.error('Erreur création commande:', orderError);
      return NextResponse.json({ error: 'Erreur lors de la création de la commande' }, { status: 500 });
    }

    // Si c'est une ressource escrow et qu'un CFX ID est fourni, l'enregistrer
    if (product.resource_type === 'escrow' && cfxId) {
      const { error: escrowError } = await supabase
        .from('order_escrow_info')
        .insert({
          order_id: order.id,
          buyer_id: user.id,
          resource_id: productId,
          cfx_id: cfxId,
          submitted_at: new Date().toISOString()
        });

      if (escrowError) {
        console.error('Erreur enregistrement CFX ID:', escrowError);
        // Ne pas faire échouer la commande pour cette erreur
      }
    }

    // Mettre à jour le compteur de téléchargements
    const { error: updateError } = await supabase
      .from('resources')
      .update({ 
        download_count: (product.download_count || 0) + quantity 
      })
      .eq('id', productId);

    if (updateError) {
      console.error('Erreur mise à jour compteur:', updateError);
    }

    // Créer une notification pour le vendeur
    try {
      const notificationResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/notifications/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: product.author_id,
          type: 'order_received',
          title: 'Nouvelle commande reçue',
          message: `${product.title} a été acheté par un client`,
          product_title: product.title,
          order_id: order.id
        })
      });

      if (!notificationResponse.ok) {
        console.error('Erreur création notification vendeur');
      }
    } catch (error) {
      console.error('Erreur notification vendeur:', error);
    }

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        product: {
          id: product.id,
          title: product.title,
          price: product.price
        },
        quantity,
        total: total,
        status: order.status,
        created_at: order.created_at
      }
    });

  } catch (error) {
    console.error('Erreur API commande:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
