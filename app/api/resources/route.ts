import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { validateResourcePayload, sanitizeResourcePayload } from '@/lib/resourceValidationServer';
import { CreateResourceFormData, ResourceFormErrors } from '@/lib/types';
import { createClient } from '@supabase/supabase-js';

// GET - Récupérer les ressources
export async function GET(request: NextRequest) {
  try {
    // Pour les requêtes GET publiques, on peut utiliser le client anon directement
    // Pas besoin d'authentification pour lister les ressources publiques
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { searchParams } = new URL(request.url);
    
    // Paramètres de filtrage
    const authorId = searchParams.get('author_id');
    const status = searchParams.get('status');
    const category = searchParams.get('category');
    const framework = searchParams.get('framework');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50); // Max 50 par page
    
    let query = supabase
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
        )
      `)
      .order('created_at', { ascending: false });
    
    // Appliquer les filtres
    if (authorId) {
      query = query.eq('author_id', authorId);
    }
    
    if (status) {
      query = query.eq('status', status);
    }
    
    if (category) {
      query = query.eq('category', category);
    }
    
    if (framework) {
      query = query.eq('framework', framework);
    }
    
    // Pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);
    
    const { data: resources, error, count } = await query;
    
    if (error) {
      console.error('Erreur récupération ressources:', error);
      return NextResponse.json(
        { error: 'Erreur lors de la récupération des ressources' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      resources: resources || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    });
    
  } catch (error) {
    console.error('Erreur API ressources:', error);
    return NextResponse.json(
      { error: 'Erreur serveur interne' },
      { status: 500 }
    );
  }
}

// POST - Créer une nouvelle ressource
export async function POST(request: NextRequest) {
  try {
    // Préférer l'auth via Bearer (envoyé depuis le client), fallback sur cookies
    const authHeader = request.headers.get('Authorization') || '';
    const hasBearer = authHeader.toLowerCase().startsWith('bearer ');

    let supabase;
    if (hasBearer) {
      const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
      const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;
      supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        global: { headers: { Authorization: authHeader } },
        auth: { persistSession: false, detectSessionInUrl: false },
      });
    } else {
      supabase = createRouteHandlerClient({ cookies });
    }
    
    // Essayer getUser en premier (plus fiable pour les routes API)
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    console.log('getUser API:', user?.email || 'Aucun utilisateur');
    
    // Fallback vers getSession si getUser échoue (cookies)
    if (!user && !hasBearer) {
      console.log('Fallback vers getSession...');
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      console.log('getSession API:', session?.user?.email || 'Aucune session');
      
      if (!session?.user) {
        console.error('Erreurs auth:', { userError, sessionError });
        return NextResponse.json(
          { error: 'Non authentifié - Veuillez vous reconnecter' },
          { status: 401 }
        );
      }
      
      const finalUser = session.user;
      console.log('Utilisateur final depuis session:', finalUser.email);
    } else if (user) {
      const finalUser = user;
      console.log('Utilisateur final depuis getUser:', finalUser.email);
    }
    
    // Variable user pour la suite
    const finalUser = user || (!hasBearer ? (await supabase.auth.getSession()).data.session?.user : null);
    if (!finalUser) {
      return NextResponse.json(
        { error: 'Impossible de vérifier l\'authentification' },
        { status: 401 }
      );
    }
    
    // Vérifier le rôle vendeur
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', finalUser.id)
      .single();
    
    if (!profile || !['seller', 'admin'].includes(profile.role)) {
      return NextResponse.json(
        { error: 'Vous devez être vendeur pour créer une ressource' },
        { status: 403 }
      );
    }
    
    const body = await request.json();
    const formData = body;
    
    // Validation côté serveur
    const errors = validateResourcePayload(formData);
    if (Object.keys(errors).length > 0) {
      return NextResponse.json(
        { error: 'Données invalides', errors },
        { status: 400 }
      );
    }
    
    // Nettoyer les données
    const cleanData = sanitizeResourcePayload(formData);
    
    // Créer la ressource principale
    const { data: resource, error: resourceError } = await supabase
      .from('resources')
      .insert({
        author_id: finalUser.id,
        title: cleanData.title,
        description: cleanData.description,
        price: cleanData.price,
        resource_type: cleanData.resource_type,
        framework: cleanData.framework,
        category: cleanData.category,
        status: 'draft'
      })
      .select()
      .single();
    
    if (resourceError) {
      console.error('Erreur création ressource:', resourceError);
      return NextResponse.json(
        { error: 'Erreur lors de la création de la ressource' },
        { status: 500 }
      );
    }
    
    // Si c'est une ressource escrow, créer les infos escrow
    if (cleanData.resource_type === 'escrow' && cleanData.escrowInfo) {
      const { error: escrowError } = await supabase
        .from('resource_escrow_info')
        .insert({
          resource_id: resource.id,
          requires_cfx_id: cleanData.escrowInfo.requires_cfx_id,
          requires_email: cleanData.escrowInfo.requires_email,
          requires_username: cleanData.escrowInfo.requires_username,
          delivery_instructions: cleanData.escrowInfo.delivery_instructions
        });
      
      if (escrowError) {
        console.error('Erreur création info escrow:', escrowError);
        // Supprimer la ressource créée en cas d'erreur
        await supabase.from('resources').delete().eq('id', resource.id);
        return NextResponse.json(
          { error: 'Erreur lors de la création des informations escrow' },
          { status: 500 }
        );
      }
    }
    
    return NextResponse.json({
      success: true,
      resource: resource,
      message: 'Ressource créée avec succès'
    }, { status: 201 });
    
  } catch (error) {
    console.error('Erreur API création ressource:', error);
    return NextResponse.json(
      { error: 'Erreur serveur interne' },
      { status: 500 }
    );
  }
}
