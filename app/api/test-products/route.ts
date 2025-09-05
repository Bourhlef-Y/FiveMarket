import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
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

    // Récupérer tous les produits approuvés
    const { data: products, error: productsError } = await supabase
      .from('resources')
      .select(`
        id,
        title,
        description,
        price,
        category,
        framework,
        images,
        download_count,
        created_at,
        status,
        author_id
      `)
      .eq('status', 'approved')
      .limit(5);

    console.log('Produits approuvés trouvés:', { products, productsError });

    if (productsError) {
      return NextResponse.json({ error: 'Erreur base de données', details: productsError.message }, { status: 500 });
    }

    return NextResponse.json({
      count: products?.length || 0,
      products: products || []
    });

  } catch (error) {
    console.error('Erreur API test produits:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
