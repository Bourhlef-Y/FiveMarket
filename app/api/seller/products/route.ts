import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  console.log('API /api/seller/products GET appelée');
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status') || '';

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

    // Vérifier le rôle
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || profile?.role !== 'seller') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    // Construire la requête
    let query = supabase
      .from('resources')
      .select(`
        id,
        title,
        description,
        price,
        framework,
        category,
        status,
        download_count,
        created_at,
        updated_at,
        approved_at,
        approved_by
      `)
      .eq('author_id', user.id)
      .order('created_at', { ascending: false });

    // Appliquer le filtre de statut
    if (status) {
      query = query.eq('status', status);
    }

    // Compter le total
    const { count, error: countError } = await query;
    if (countError) {
      console.error('Erreur comptage produits:', countError);
      throw countError;
    }

    // Appliquer la pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    // Exécuter la requête
    const { data: products, error: productsError } = await query;

    if (productsError) {
      console.error('Erreur récupération produits:', productsError);
      throw productsError;
    }

    console.log('Produits vendeur récupérés:', products?.length || 0);

    return NextResponse.json({
      products: products || [],
      totalCount: count || 0,
      currentPage: page,
      totalPages: Math.ceil((count || 0) / limit)
    });

  } catch (error: unknown) {
    console.error('Erreur API produits vendeur:', error instanceof Error ? error.message : String(error));
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
