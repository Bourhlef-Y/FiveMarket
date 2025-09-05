import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  console.log('API /api/admin/products/[id] GET appelée');
  try {
    const { id: productId } = await params;

    if (!productId) {
      return NextResponse.json({ error: 'ID de produit requis' }, { status: 400 });
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

    // Récupérer le produit avec toutes les informations
    const { data: product, error: productError } = await supabase
      .from('resources')
      .select(`
        *,
        profiles!resources_author_id_fkey (
          username,
          avatar,
          auth_email
        )
      `)
      .eq('id', productId)
      .single();

    if (productError) {
      console.error('Erreur récupération produit:', productError);
      return NextResponse.json({ error: 'Produit non trouvé' }, { status: 404 });
    }

    // Transformer les données
    const response = {
      id: product.id,
      title: product.title,
      description: product.description,
      price: product.price,
      framework: product.framework,
      category: product.category,
      status: product.status,
      resource_type: product.resource_type,
      download_count: product.download_count,
      version: product.version,
      download_url: product.download_url,
      thumbnail: product.thumbnail,
      images: product.images || [],
      created_at: product.created_at,
      updated_at: product.updated_at,
      approved_at: product.approved_at,
      approved_by: product.approved_by,
      author_id: product.author_id,
      author_username: product.profiles?.username || 'Utilisateur inconnu',
      author_avatar: product.profiles?.avatar || null,
      author_email: product.profiles?.auth_email || 'Email non disponible'
    };

    return NextResponse.json(response);
  } catch (error: unknown) {
    console.error('Erreur API produit admin:', error instanceof Error ? error.message : String(error));
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  console.log('API /api/admin/products/[id] PATCH appelée');
  try {
    const { id: productId } = await params;
    const { status, reason } = await request.json();

    if (!productId || !['draft', 'pending', 'approved', 'rejected', 'suspended'].includes(status)) {
      return NextResponse.json({ error: 'Paramètres invalides' }, { status: 400 });
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

    // Vérifier si l'utilisateur est admin
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError) throw authError;

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user?.id)
      .single();

    if (profileError || profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    // Préparer les données de mise à jour
    const updateData: any = { status };

    // Si le produit est approuvé, ajouter les informations d'approbation
    if (status === 'approved') {
      updateData.approved_at = new Date().toISOString();
      updateData.approved_by = user?.id;
    }

    // Mettre à jour le statut du produit
    const { error: updateError } = await supabase
      .from('resources')
      .update(updateData)
      .eq('id', productId);

    if (updateError) {
      console.error('Erreur mise à jour produit:', updateError);
      throw updateError;
    }

    return NextResponse.json({ 
      message: 'Statut du produit mis à jour',
      status: status
    });
  } catch (error: unknown) {
    console.error('Erreur API produit admin:', error instanceof Error ? error.message : String(error));
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
