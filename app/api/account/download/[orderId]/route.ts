import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  console.log('API /api/account/download/[orderId] GET appelée');
  try {
    const { orderId } = await params;

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

    // Vérifier que la commande appartient à l'utilisateur
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        id,
        user_id,
        resource_id,
        status,
        resources!inner (
          id,
          title,
          download_url,
          status
        )
      `)
      .eq('id', orderId)
      .eq('user_id', user.id)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: 'Commande non trouvée' }, { status: 404 });
    }

    // Vérifier que la commande est payée
    if (order.status !== 'completed' && order.status !== 'paid') {
      return NextResponse.json({ error: 'Commande non payée' }, { status: 403 });
    }

    // Vérifier que la ressource est approuvée
    if (order.resources.status !== 'approved') {
      return NextResponse.json({ error: 'Ressource non disponible' }, { status: 403 });
    }

    // Vérifier que l'URL de téléchargement existe
    if (!order.resources.download_url) {
      return NextResponse.json({ error: 'Lien de téléchargement non disponible' }, { status: 404 });
    }

    // Enregistrer le téléchargement
    await supabase
      .from('downloads')
      .insert({
        order_id: orderId,
        user_id: user.id,
        resource_id: order.resource_id,
        downloaded_at: new Date().toISOString()
      });

    // Retourner l'URL de téléchargement
    return NextResponse.json({
      downloadUrl: order.resources.download_url,
      resourceTitle: order.resources.title,
      message: 'Téléchargement autorisé'
    });

  } catch (error: unknown) {
    console.error('Erreur API téléchargement:', error instanceof Error ? error.message : String(error));
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
