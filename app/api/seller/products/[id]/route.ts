import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  console.log('API /api/seller/products/[id] GET appelée');
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

    // Vérifier le rôle
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || profile?.role !== 'seller') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    // Récupérer le produit
    const { data: product, error: productError } = await supabase
      .from('resources')
      .select(`
        id,
        title,
        description,
        price,
        status,
        download_count,
        category,
        framework,
        tags,
        image_url,
        created_at,
        updated_at,
        author_id
      `)
      .eq('id', id)
      .eq('author_id', user.id)
      .single();

    if (productError) {
      console.error('Erreur récupération produit:', productError);
      return NextResponse.json({ error: 'Produit non trouvé' }, { status: 404 });
    }

    console.log('Produit vendeur récupéré:', product.id);

    return NextResponse.json(product);

  } catch (error: unknown) {
    console.error('Erreur API produit vendeur:', error instanceof Error ? error.message : String(error));
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
  console.log('API /api/seller/products/[id] PATCH appelée');
  try {
    const { id } = await params;
    const body = await request.json();

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

    // Vérifier que le produit appartient au vendeur
    const { data: existingProduct, error: checkError } = await supabase
      .from('resources')
      .select('id, author_id')
      .eq('id', id)
      .eq('author_id', user.id)
      .single();

    if (checkError || !existingProduct) {
      return NextResponse.json({ error: 'Produit non trouvé' }, { status: 404 });
    }

    // Préparer les données à mettre à jour
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    // Ajouter les champs modifiables
    if (body.status !== undefined) updateData.status = body.status;
    if (body.title !== undefined) updateData.title = body.title;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.price !== undefined) updateData.price = body.price;
    if (body.category !== undefined) updateData.category = body.category;
    if (body.framework !== undefined) updateData.framework = body.framework;
    if (body.tags !== undefined) updateData.tags = body.tags;
    if (body.image_url !== undefined) updateData.image_url = body.image_url;

    // Mettre à jour le produit
    const { data: updatedProduct, error: updateError } = await supabase
      .from('resources')
      .update(updateData)
      .eq('id', id)
      .eq('author_id', user.id)
      .select()
      .single();

    if (updateError) {
      console.error('Erreur mise à jour produit:', updateError);
      throw updateError;
    }

    console.log('Produit vendeur mis à jour:', updatedProduct.id);

    return NextResponse.json(updatedProduct);

  } catch (error: unknown) {
    console.error('Erreur API mise à jour produit vendeur:', error instanceof Error ? error.message : String(error));
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  console.log('API /api/seller/products/[id] DELETE appelée');
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

    // Vérifier le rôle
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || profile?.role !== 'seller') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    // Vérifier que le produit appartient au vendeur
    const { data: existingProduct, error: checkError } = await supabase
      .from('resources')
      .select('id, author_id, title')
      .eq('id', id)
      .eq('author_id', user.id)
      .single();

    if (checkError || !existingProduct) {
      return NextResponse.json({ error: 'Produit non trouvé' }, { status: 404 });
    }

    // Supprimer le produit
    const { error: deleteError } = await supabase
      .from('resources')
      .delete()
      .eq('id', id)
      .eq('author_id', user.id);

    if (deleteError) {
      console.error('Erreur suppression produit:', deleteError);
      throw deleteError;
    }

    console.log('Produit vendeur supprimé:', existingProduct.id);

    return NextResponse.json({ 
      message: 'Produit supprimé avec succès',
      product: existingProduct
    });

  } catch (error: unknown) {
    console.error('Erreur API suppression produit vendeur:', error instanceof Error ? error.message : String(error));
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
