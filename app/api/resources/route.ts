import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { validateResourcePayload, sanitizeResourcePayload, isResourceComplete } from '@/lib/resourceValidationServer';
import { CreateResourceFormData, ResourceFormErrors } from '@/lib/types';
import { createClient } from '@supabase/supabase-js';

// Helper pour créer le client Supabase avec authentification (pour les routes API)
async function createAuthenticatedSupabaseClient(request: NextRequest) {
  const authHeader = request.headers.get('Authorization') || '';
  const hasBearer = authHeader.toLowerCase().startsWith('bearer ');
  const cookieStore = await cookies(); // Appeler cookies() une seule fois ici

  if (hasBearer) {
    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
    const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;
    return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false, detectSessionInUrl: false },
    });
  } else {
    return createServerClient(
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
  }
}

// GET - Récupérer les ressources
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Pour les requêtes GET publiques, on peut utiliser le client anon directement
    // Pas besoin d'authentification pour lister les ressources publiques
    let supabaseClient;

    const authorId = searchParams.get('author_id');
    if (authorId) {
      supabaseClient = await createAuthenticatedSupabaseClient(request);
    } else {
      supabaseClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
    }
    
    // Paramètres de filtrage
    const status = searchParams.get('status');
    const category = searchParams.get('category');
    const framework = searchParams.get('framework');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 50); // Max 50 par page
    
    let query = supabaseClient
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
    const supabase = await createAuthenticatedSupabaseClient(request);
    
    let finalUser = null;
    let finalSupabase = supabase;

    // Tenter d'abord avec getUser
    const { data: { user }, error: getUserError } = await supabase.auth.getUser();
    if (user) {
      finalUser = user;
      console.log('Utilisateur final depuis getUser:', finalUser.email);
    } else if (getUserError) {
      console.error('Erreur getUser:', getUserError);
    }

    // Si pas d'utilisateur via getUser, essayer getSession (pour les cookies)
    if (!finalUser) {
      console.log('Fallback vers getSession...');
      const { data: { session }, error: getSessionError } = await supabase.auth.getSession();
      if (session?.user) {
        finalUser = session.user;
        console.log('Utilisateur final depuis session:', finalUser.email);
      } else if (getSessionError) {
        console.error('Erreur getSession:', getSessionError);
      }
    }
    
    if (!finalUser) {
      return NextResponse.json(
        { error: 'Non authentifié - Veuillez vous reconnecter' },
        { status: 401 }
      );
    }
    
    // Vérifier le rôle vendeur
    const { data: profile, error: profileError } = await finalSupabase
      .from('profiles')
      .select('role')
      .eq('id', finalUser.id)
      .single();
    
    if (profileError) {
      console.error('Erreur récupération profil:', profileError);
      return NextResponse.json(
        { error: 'Erreur lors de la récupération du profil utilisateur' },
        { status: 500 }
      );
    }
    
    if (!profile || profile.role !== 'seller') {
      return NextResponse.json(
        { error: 'Vous devez être vendeur pour créer une ressource' },
        { status: 403 }
      );
    }
    
    const body = await request.json();
    const formData = body;
    const { status: requestedStatus = 'draft' } = body; // Par défaut 'draft', peut être 'pending'
    
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
    
    // Déterminer le statut final
    let finalStatus = 'draft';
    if (requestedStatus === 'pending') {
      // Vérifier si le produit est complet avant de le mettre en attente
      if (isResourceComplete(cleanData)) {
        finalStatus = 'pending';
      } else {
        return NextResponse.json(
          { error: 'Le produit doit être complet pour être soumis en attente de validation' },
          { status: 400 }
        );
      }
    }
    
    // Créer la ressource principale
    const { data: resource, error: resourceError } = await finalSupabase
      .from('resources')
      .insert({
        author_id: finalUser.id,
        title: cleanData.title,
        description: cleanData.description,
        price: cleanData.price,
        resource_type: cleanData.resource_type,
        framework: cleanData.framework,
        category: cleanData.category,
        status: finalStatus
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
      const { error: escrowError } = await finalSupabase
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
        await finalSupabase.from('resources').delete().eq('id', resource.id);
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
