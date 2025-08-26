import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { v4 as uuidv4 } from 'uuid';

// POST - Ajouter des images à une ressource
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: resourceId } = await context.params;
    
    // Vérifier l'authentification
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }
    
    // Vérifier que l'utilisateur est le propriétaire de la ressource
    const { data: resource, error: resourceError } = await supabase
      .from('resources')
      .select('author_id, images')
      .eq('id', resourceId)
      .single();
    
    if (resourceError) {
      return NextResponse.json(
        { error: 'Ressource non trouvée' },
        { status: 404 }
      );
    }
    
    if (resource.author_id !== user.id) {
      return NextResponse.json(
        { error: 'Non autorisé à modifier cette ressource' },
        { status: 403 }
      );
    }
    
    const body = await request.json();
    const { images: newImages } = body;
    
    if (!newImages || !Array.isArray(newImages)) {
      return NextResponse.json(
        { error: 'Données d\'images invalides' },
        { status: 400 }
      );
    }
    
    // Convertir les nouvelles images au format JSONB
    const currentImages = resource.images || [];
    const imagesToAdd = newImages.map((img, index) => ({
      id: uuidv4(),
      image: img.image_url,
      is_thumbnail: img.is_thumbnail || false,
      upload_order: currentImages.length + index + 1,
      created_at: new Date().toISOString()
    }));
    
    // Mettre à jour la ressource avec les nouvelles images
    const { data: updatedResource, error: updateError } = await supabase
      .from('resources')
      .update({
        images: [...currentImages, ...imagesToAdd]
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
      message: 'Images ajoutées avec succès'
    });
    
  } catch (error) {
    console.error('Erreur API ajout images:', error);
    return NextResponse.json(
      { error: 'Erreur serveur interne' },
      { status: 500 }
    );
  }
}

// GET - Récupérer les images d'une ressource
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: resourceId } = await context.params;
    
    const supabase = createRouteHandlerClient({ cookies });
    
    const { data: resource, error } = await supabase
      .from('resources')
      .select('images')
      .eq('id', resourceId)
      .single();
    
    if (error) {
      console.error('Erreur récupération images:', error);
      return NextResponse.json(
        { error: 'Erreur lors de la récupération des images' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ 
      images: resource.images || []
    });
    
  } catch (error) {
    console.error('Erreur API images:', error);
    return NextResponse.json(
      { error: 'Erreur serveur interne' },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer une image spécifique
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: resourceId } = await context.params;
    const { searchParams } = new URL(request.url);
    const imageId = searchParams.get('imageId');

    if (!imageId) {
      return NextResponse.json(
        { error: 'ID d\'image requis' },
        { status: 400 }
      );
    }
    
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }
    
    // Récupérer la ressource et vérifier les droits
    const { data: resource, error: resourceError } = await supabase
      .from('resources')
      .select('author_id, images')
      .eq('id', resourceId)
      .single();
    
    if (resourceError || !resource) {
      return NextResponse.json(
        { error: 'Ressource non trouvée' },
        { status: 404 }
      );
    }
    
    if (resource.author_id !== user.id) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 403 }
      );
    }
    
    // Filtrer l'image à supprimer
    const updatedImages = (resource.images || []).filter(
      (img: any) => img.id !== imageId
    );
    
    // Mettre à jour l'ordre des images restantes
    const reorderedImages = updatedImages.map((img: any, index: number) => ({
      ...img,
      upload_order: index + 1
    }));
    
    // Mettre à jour la ressource
    const { error: updateError } = await supabase
      .from('resources')
      .update({ images: reorderedImages })
      .eq('id', resourceId);
    
    if (updateError) {
      return NextResponse.json(
        { error: 'Erreur lors de la suppression de l\'image' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
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