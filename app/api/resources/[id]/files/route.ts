import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

// POST - Ajouter un fichier à une ressource
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createRouteHandlerClient({ 
      cookies
    });
    const { id: resourceId } = await context.params;
    
    // Vérifier l'authentification
    let user = null;
    
    // 1. Essayer d'abord avec les cookies
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !authUser) {
      // 2. Fallback: essayer avec le header Authorization en utilisant un client admin
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
            console.log('Authentification réussie via Bearer token (files):', tokenUser.email);
          }
        } catch (tokenError) {
          console.error('Erreur validation token (files):', tokenError);
        }
      }
      
      if (!user) {
        console.error('Erreur auth fichiers - cookies:', authError);
        return NextResponse.json(
          { error: 'Non authentifié' },
          { status: 401 }
        );
      }
    } else {
      user = authUser;
      console.log('Authentification réussie via cookies (files):', user.email);
    }
    
    // Vérifier que l'utilisateur est le propriétaire de la ressource
    const { data: resource, error: resourceError } = await supabase
      .from('resources')
      .select('author_id, resource_type')
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
    
    // Vérifier que c'est bien une ressource non-escrow
    if (resource.resource_type !== 'non_escrow') {
      return NextResponse.json(
        { error: 'Seules les ressources non-escrow peuvent avoir des fichiers' },
        { status: 400 }
      );
    }
    
    const body = await request.json();
    const { file_url, file_name, file_size, file_type } = body;
    
    if (!file_url || !file_name || !file_size) {
      return NextResponse.json(
        { error: 'Données de fichier manquantes' },
        { status: 400 }
      );
    }
    
    // Ajouter le fichier à la base de données
    const { data: insertedFile, error: insertError } = await supabase
      .from('resource_files')
      .insert({
        resource_id: resourceId,
        file_url,
        file_name,
        file_size,
        file_type
      })
      .select()
      .single();
    
    if (insertError) {
      console.error('Erreur insertion fichier:', insertError);
      return NextResponse.json(
        { error: 'Erreur lors de l\'ajout du fichier' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      file: insertedFile,
      message: 'Fichier ajouté avec succès'
    });
    
  } catch (error) {
    console.error('Erreur API ajout fichier:', error);
    return NextResponse.json(
      { error: 'Erreur serveur interne' },
      { status: 500 }
    );
  }
}

// GET - Récupérer les fichiers d'une ressource
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createRouteHandlerClient({ 
      cookies
    });
    const { id: resourceId } = await context.params;
    
    // Vérifier l'authentification pour accéder aux fichiers
    let user = null;
    
    // 1. Essayer d'abord avec les cookies
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !authUser) {
      // 2. Fallback: essayer avec le header Authorization en utilisant un client admin
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
            console.log('Authentification réussie via Bearer token (GET files):', tokenUser.email);
          }
        } catch (tokenError) {
          console.error('Erreur validation token (GET files):', tokenError);
        }
      }
      
      if (!user) {
        console.error('Erreur auth GET fichiers - cookies:', authError);
        return NextResponse.json(
          { error: 'Non authentifié' },
          { status: 401 }
        );
      }
    } else {
      user = authUser;
      console.log('Authentification réussie via cookies (GET files):', user.email);
    }
    
    // Vérifier les droits d'accès (propriétaire ou acheteur avec commande validée)
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
    
    // Si ce n'est pas le propriétaire, vérifier qu'il a acheté la ressource
    if (!isOwner) {
      const { data: order } = await supabase
        .from('orders')
        .select('id')
        .eq('buyer_id', user.id)
        .eq('resource_id', resourceId)
        .eq('status', 'completed')
        .single();
      
      if (!order) {
        return NextResponse.json(
          { error: 'Vous devez acheter cette ressource pour accéder aux fichiers' },
          { status: 403 }
        );
      }
    }
    
    const { data: files, error } = await supabase
      .from('resource_files')
      .select('*')
      .eq('resource_id', resourceId)
      .order('created_at', { ascending: true });
    
    if (error) {
      console.error('Erreur récupération fichiers:', error);
      return NextResponse.json(
        { error: 'Erreur lors de la récupération des fichiers' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ files: files || [] });
    
  } catch (error) {
    console.error('Erreur API fichiers:', error);
    return NextResponse.json(
      { error: 'Erreur serveur interne' },
      { status: 500 }
    );
  }
}
