import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  console.log('API /api/admin/products GET appelée');
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const category = searchParams.get('category') || '';

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

    // Vérifier si l'utilisateur est admin
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError) {
      console.error('Erreur d\'authentification:', authError);
      throw authError;
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user?.id)
      .single();

    if (profileError || profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    // Construire la requête de base
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
        approved_by,
        author_id,
        profiles!resources_author_id_fkey (
          username,
          avatar
        )
      `)
      .order('created_at', { ascending: false });

    // Appliquer les filtres
    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }

    if (status) {
      query = query.eq('status', status);
    }

    if (category) {
      query = query.eq('category', category);
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

    // Transformer les données
    const transformedProducts = products?.map((product: any) => ({
      id: product.id,
      title: product.title,
      description: product.description,
      price: product.price,
      framework: product.framework,
      category: product.category,
      status: product.status,
      download_count: product.download_count,
      created_at: product.created_at,
      updated_at: product.updated_at,
      approved_at: product.approved_at,
      approved_by: product.approved_by,
      author_id: product.author_id,
      author_username: product.profiles?.username || 'Utilisateur inconnu',
      author_avatar: product.profiles?.avatar || null
    })) || [];

    console.log('Produits récupérés:', transformedProducts.length);

    return NextResponse.json({
      products: transformedProducts,
      totalCount: count || 0,
      currentPage: page,
      totalPages: Math.ceil((count || 0) / limit)
    });

  } catch (error: unknown) {
    console.error('Erreur API produits admin:', error instanceof Error ? error.message : String(error));
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
