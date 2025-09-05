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

    console.log('Recherche du produit avec ID:', id);

    // Récupérer le produit d'abord
    const { data: product, error: productError } = await supabase
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
        author_id,
        resource_type
      `)
      .eq('id', id)
      .eq('status', 'approved')
      .single();

    console.log('Résultat de la requête produit:', { product, productError });

    if (productError) {
      console.error('Erreur lors de la récupération du produit:', productError);
      return NextResponse.json({ error: 'Erreur lors de la récupération du produit', details: productError.message }, { status: 500 });
    }

    if (!product) {
      return NextResponse.json({ error: 'Produit non trouvé' }, { status: 404 });
    }

    // Récupérer les informations de l'auteur
    const { data: author, error: authorError } = await supabase
      .from('profiles')
      .select('id, username')
      .eq('id', product.author_id)
      .single();

    console.log('Résultat de la requête auteur:', { author, authorError });

    if (authorError) {
      console.error('Erreur lors de la récupération de l\'auteur:', authorError);
      return NextResponse.json({ error: 'Erreur lors de la récupération de l\'auteur', details: authorError.message }, { status: 500 });
    }

    // Formater la réponse
    const formattedProduct = {
      id: product.id,
      title: product.title,
      description: product.description,
      price: product.price,
      category: product.category,
      framework: product.framework,
      images: product.images,
      download_count: product.download_count,
      created_at: product.created_at,
      resource_type: product.resource_type,
      author: {
        id: author.id,
        username: author.username
      }
    };

    return NextResponse.json(formattedProduct);

  } catch (error) {
    console.error('Erreur API produit:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
