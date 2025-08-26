import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

// GET - Récupérer une ressource spécifique
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { id: resourceId } = await context.params;
    
    const { data: resource, error } = await supabase
      .from('resources')
      .select(`
        *,
        profiles:author_id (
          username,
          avatar
        ),
        resource_images (
          id,
          image_url,
          is_thumbnail,
          upload_order
        ),
        resource_files (
          id,
          file_name,
          file_size,
          created_at
        ),
        resource_escrow_info (
          requires_cfx_id,
          requires_email,
          requires_username,
          delivery_instructions
        )
      `)
      .eq('id', resourceId)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Ressource non trouvée' },
          { status: 404 }
        );
      }
      
      console.error('Erreur récupération ressource:', error);
      return NextResponse.json(
        { error: 'Erreur lors de la récupération de la ressource' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ resource });
    
  } catch (error) {
    console.error('Erreur API ressource:', error);
    return NextResponse.json(
      { error: 'Erreur serveur interne' },
      { status: 500 }
    );
  }
}

// PUT - Mettre à jour une ressource
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { id: resourceId } = await context.params;
    
    // Vérifier l'authentification
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
      .select('author_id')
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
    const updateData = body;
    
    // Mettre à jour la ressource
    const { data: updatedResource, error: updateError } = await supabase
      .from('resources')
      .update(updateData)
      .eq('id', resourceId)
      .select()
      .single();
    
    if (updateError) {
      console.error('Erreur mise à jour ressource:', updateError);
      return NextResponse.json(
        { error: 'Erreur lors de la mise à jour' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      resource: updatedResource,
      message: 'Ressource mise à jour avec succès'
    });
    
  } catch (error) {
    console.error('Erreur API mise à jour ressource:', error);
    return NextResponse.json(
      { error: 'Erreur serveur interne' },
      { status: 500 }
    );
  }
}

// PATCH - Mise à jour partielle d'une ressource
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: resourceId } = await context.params;
    
    // Vérifier l'authentification - Priorité au Bearer token pour éviter les erreurs cookies
    let user = null;
    let supabase = null;
    
    // 1. Essayer d'abord avec le header Authorization (plus fiable)
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      
      // Créer un client admin pour valider le token
      const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false
          }
        }
      );
      
      try {
        // Décoder et valider le JWT
        const { data: { user: tokenUser }, error: tokenError } = await supabaseAdmin.auth.getUser(token);
        if (!tokenError && tokenUser) {
          user = tokenUser;
          supabase = supabaseAdmin; // Utiliser le client admin pour les requêtes
          console.log('Authentification réussie via Bearer token (PATCH):', tokenUser.email);
        }
      } catch (tokenError) {
        console.error('Erreur validation token (PATCH):', tokenError);
      }
    }
    
    // 2. Fallback: essayer avec les cookies seulement si pas de Bearer token
    if (!user && !authHeader) {
      try {
        const supabaseCookies = createRouteHandlerClient({ cookies });
        const { data: { user: authUser }, error: authError } = await supabaseCookies.auth.getUser();
        
        if (!authError && authUser) {
          user = authUser;
          supabase = supabaseCookies;
          console.log('Authentification réussie via cookies (PATCH):', user.email);
        }
      } catch (cookieError) {
        console.error('Erreur cookies (PATCH):', cookieError);
      }
    }
    
    if (!user || !supabase) {
      console.error('Erreur auth PATCH - aucune méthode fonctionnelle');
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }
    
    // Vérifier que l'utilisateur est le propriétaire de la ressource
    const { data: resource, error: resourceError } = await supabase
      .from('resources')
      .select('author_id')
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
    
    // Filtrer les champs autorisés pour mise à jour
    const allowedFields = [
      'title', 'description', 'price', 'resource_type', 
      'framework', 'category', 'status', 'thumbnail_url'
    ];
    
    const updateData: any = {};
    allowedFields.forEach(field => {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    });
    
    updateData.updated_at = new Date().toISOString();
    
    // Mettre à jour la ressource
    const { data: updatedResource, error: updateError } = await supabase
      .from('resources')
      .update(updateData)
      .eq('id', resourceId)
      .select()
      .single();
    
    if (updateError) {
      console.error('Erreur mise à jour ressource:', updateError);
      return NextResponse.json(
        { error: 'Erreur lors de la mise à jour' },
        { status: 500 }
      );
    }
    
    // Gérer les informations escrow si présentes
    if (body.escrowInfo && body.resource_type === 'escrow') {
      await supabase
        .from('resource_escrow_info')
        .upsert({
          resource_id: resourceId,
          requires_cfx_id: body.escrowInfo.requires_cfx_id || false,
          requires_email: body.escrowInfo.requires_email || false,
          requires_username: body.escrowInfo.requires_username || false,
          delivery_instructions: body.escrowInfo.delivery_instructions || ''
        });
    }
    
    return NextResponse.json({
      success: true,
      resource: updatedResource,
      message: 'Ressource mise à jour avec succès'
    });
    
  } catch (error) {
    console.error('Erreur API mise à jour ressource:', error);
    return NextResponse.json(
      { error: 'Erreur serveur interne' },
      { status: 500 }
    );
  }
}

// DELETE - Supprimer une ressource
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: resourceId } = await context.params;
    
    // Vérifier l'authentification - Priorité au Bearer token pour éviter les erreurs cookies
    let user = null;
    let supabase = null;
    
    // 1. Essayer d'abord avec le header Authorization (plus fiable)
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      
      // Créer un client admin pour valider le token
      const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false
          }
        }
      );
      
      try {
        // Décoder et valider le JWT
        const { data: { user: tokenUser }, error: tokenError } = await supabaseAdmin.auth.getUser(token);
        if (!tokenError && tokenUser) {
          user = tokenUser;
          supabase = supabaseAdmin; // Utiliser le client admin pour les requêtes
          console.log('Authentification réussie via Bearer token (DELETE):', tokenUser.email);
        }
      } catch (tokenError) {
        console.error('Erreur validation token (DELETE):', tokenError);
      }
    }
    
    // 2. Fallback: essayer avec les cookies seulement si pas de Bearer token
    if (!user && !authHeader) {
      try {
        const supabaseCookies = createRouteHandlerClient({ cookies });
        const { data: { user: authUser }, error: authError } = await supabaseCookies.auth.getUser();
        
        if (!authError && authUser) {
          user = authUser;
          supabase = supabaseCookies;
          console.log('Authentification réussie via cookies (DELETE):', user.email);
        }
      } catch (cookieError) {
        console.error('Erreur cookies (DELETE):', cookieError);
      }
    }
    
    if (!user || !supabase) {
      console.error('Erreur auth DELETE - aucune méthode fonctionnelle');
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }
    
    // Vérifier que l'utilisateur est le propriétaire de la ressource ou admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    
    const { data: resource, error: resourceError } = await supabase
      .from('resources')
      .select('author_id')
      .eq('id', resourceId)
      .single();
    
    if (resourceError) {
      return NextResponse.json(
        { error: 'Ressource non trouvée' },
        { status: 404 }
      );
    }
    
    const isOwner = resource.author_id === user.id;
    const isAdmin = profile?.role === 'admin';
    
    if (!isOwner && !isAdmin) {
      return NextResponse.json(
        { error: 'Non autorisé à supprimer cette ressource' },
        { status: 403 }
      );
    }
    
    // Supprimer la ressource (cascade supprimera les images/fichiers associés)
    const { error: deleteError } = await supabase
      .from('resources')
      .delete()
      .eq('id', resourceId);
    
    if (deleteError) {
      console.error('Erreur suppression ressource:', deleteError);
      return NextResponse.json(
        { error: 'Erreur lors de la suppression' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: 'Ressource supprimée avec succès'
    });
    
  } catch (error) {
    console.error('Erreur API suppression ressource:', error);
    return NextResponse.json(
      { error: 'Erreur serveur interne' },
      { status: 500 }
    );
  }
}
