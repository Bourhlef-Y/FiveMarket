import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// GET - Récupérer les images d'une ressource
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: resourceId } = await context.params;
    
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );

    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    // Récupérer la ressource
    const { data: resource, error: resourceError } = await supabase
      .from('resources')
      .select('*')
      .eq('id', resourceId)
      .single();

    if (resourceError || !resource) {
      return NextResponse.json(
        { error: 'Ressource non trouvée' },
        { status: 404 }
      );
    }

    // Vérifier que l'utilisateur est le propriétaire
    if (resource.author_id !== user.id) {
      return NextResponse.json(
        { error: 'Accès non autorisé' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      images: resource.images || []
    });

  } catch (error) {
    console.error('Erreur API récupération images:', error);
    return NextResponse.json(
      { error: 'Erreur serveur interne' },
      { status: 500 }
    );
  }
}

// POST - Ajouter des images à une ressource
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: resourceId } = await context.params;
    
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );

    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    // Récupérer la ressource
    const { data: resource, error: resourceError } = await supabase
      .from('resources')
      .select('*')
      .eq('id', resourceId)
      .single();

    if (resourceError || !resource) {
      return NextResponse.json(
        { error: 'Ressource non trouvée' },
        { status: 404 }
      );
    }

    // Vérifier que l'utilisateur est le propriétaire
    if (resource.author_id !== user.id) {
      return NextResponse.json(
        { error: 'Accès non autorisé' },
        { status: 403 }
      );
    }

    // Récupérer les données JSON avec URLs d'images déjà uploadées
    const body = await request.json();
    const imagesToSave = body.images || [];
    
    if (!imagesToSave || imagesToSave.length === 0) {
      return NextResponse.json(
        { error: 'Aucune image fournie' },
        { status: 400 }
      );
    }

    const currentImages = resource.images || [];
    
    if (imagesToSave.length === 0) {
      return NextResponse.json(
        { error: 'Aucune image n\'a pu être uploadée' },
        { status: 500 }
      );
    }

    // Mettre à jour la ressource avec les nouvelles images
    const { data: updatedResource, error: updateError } = await supabase
      .from('resources')
      .update({
        images: [...currentImages, ...imagesToSave]
      })
      .eq('id', resourceId)
      .select('images')
      .single();

    if (updateError) {
      console.error('Erreur mise à jour images:', updateError);
      return NextResponse.json(
        { error: 'Erreur lors de l\'ajout des images' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      images: updatedResource.images,
      message: `${imagesToSave.length} image(s) ajoutée(s) avec succès`
    });

  } catch (error) {
    console.error('Erreur API ajout images:', error);
    return NextResponse.json(
      { error: 'Erreur serveur interne' },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer une image d'une ressource
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: resourceId } = await context.params;
    
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );

    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    // Récupérer la ressource
    const { data: resource, error: resourceError } = await supabase
      .from('resources')
      .select('*')
      .eq('id', resourceId)
      .single();

    if (resourceError || !resource) {
      return NextResponse.json(
        { error: 'Ressource non trouvée' },
        { status: 404 }
      );
    }

    // Vérifier que l'utilisateur est le propriétaire
    if (resource.author_id !== user.id) {
      return NextResponse.json(
        { error: 'Accès non autorisé' },
        { status: 403 }
      );
    }

    // Récupérer l'URL de l'image à supprimer
    const { searchParams } = new URL(request.url);
    const imageUrl = searchParams.get('imageUrl');
    
    if (!imageUrl) {
      return NextResponse.json(
        { error: 'URL de l\'image manquante' },
        { status: 400 }
      );
    }

    const currentImages = resource.images || [];
    
    // Supprimer l'image de la liste
    const updatedImages = currentImages.filter((img: any) => {
      if (typeof img === 'string') {
        // Si c'est une chaîne JSON, parser et comparer
        try {
          const parsed = JSON.parse(img);
          return parsed.image_url !== imageUrl;
        } catch {
          return img !== imageUrl;
        }
      }
      // Si c'est un objet, comparer directement
      return img.image_url !== imageUrl;
    });

    // Mettre à jour la ressource
    const { data: updatedResource, error: updateError } = await supabase
      .from('resources')
      .update({
        images: updatedImages
      })
      .eq('id', resourceId)
      .select('images')
      .single();

    if (updateError) {
      console.error('Erreur mise à jour images:', updateError);
      return NextResponse.json(
        { error: 'Erreur lors de la suppression de l\'image' },
        { status: 500 }
      );
    }

    // Optionnel: Supprimer le fichier du storage Supabase
    try {
      // Extraire le chemin du fichier depuis l'URL
      const urlParts = imageUrl.split('/storage/v1/object/public/images/');
      if (urlParts.length > 1) {
        const filePath = urlParts[1];
        await supabase.storage
          .from('images')
          .remove([filePath]);
      }
    } catch (storageError) {
      console.error('Erreur suppression fichier storage:', storageError);
      // Ne pas faire échouer la requête si la suppression du fichier échoue
    }

    return NextResponse.json({
      success: true,
      images: updatedResource.images,
      message: 'Image supprimée avec succès'
    });

  } catch (error) {
    console.error('Erreur API suppression image:', error);
    return NextResponse.json(
      { error: 'Erreur serveur interne' },
      { status: 500 }
    );
  }
}