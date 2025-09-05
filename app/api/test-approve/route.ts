import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST() {
  try {
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

    // Récupérer tous les produits en attente
    const { data: pendingProducts, error: pendingError } = await supabase
      .from('resources')
      .select('id, title, status')
      .eq('status', 'pending');

    if (pendingError) {
      return NextResponse.json({ error: 'Erreur base de données', details: pendingError.message }, { status: 500 });
    }

    if (!pendingProducts || pendingProducts.length === 0) {
      return NextResponse.json({ message: 'Aucun produit en attente trouvé' });
    }

    // Approuver le premier produit en attente
    const productToApprove = pendingProducts[0];
    const { error: updateError } = await supabase
      .from('resources')
      .update({ 
        status: 'approved',
        approved_at: new Date().toISOString(),
        approved_by: user.id
      })
      .eq('id', productToApprove.id);

    if (updateError) {
      return NextResponse.json({ error: 'Erreur lors de l\'approbation', details: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ 
      message: 'Produit approuvé avec succès',
      product: productToApprove
    });

  } catch (error) {
    console.error('Erreur API test approve:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
