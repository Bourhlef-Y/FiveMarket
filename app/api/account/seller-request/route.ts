import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  console.log('API /api/account/seller-request POST appelée');
  try {
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

    // Récupérer les données de la requête
    const { businessName, businessType, motivation } = await request.json();

    // Validation des données
    if (!businessName || !businessType || !motivation) {
      return NextResponse.json({ error: 'Tous les champs sont requis' }, { status: 400 });
    }

    // Vérifier s'il existe déjà une demande en cours
    const { data: existingRequest, error: existingRequestError } = await supabase
      .from('seller_requests')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'pending')
      .single();

    if (existingRequestError && existingRequestError.code !== 'PGRST116') {
      console.error('Erreur lors de la vérification des demandes existantes:', existingRequestError);
      return NextResponse.json({ error: 'Erreur lors de la vérification des demandes' }, { status: 500 });
    }

    if (existingRequest) {
      return NextResponse.json({ error: 'Une demande est déjà en cours de traitement' }, { status: 400 });
    }

    // Vérifier le rôle actuel de l'utilisateur
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('Erreur lors de la récupération du profil:', profileError);
      return NextResponse.json({ error: 'Erreur lors de la récupération du profil' }, { status: 500 });
    }

    if (profile.role === 'seller') {
      return NextResponse.json({ error: 'Vous êtes déjà un vendeur' }, { status: 400 });
    }

    if (profile.role === 'admin') {
      return NextResponse.json({ error: 'Les administrateurs ne peuvent pas devenir vendeurs' }, { status: 403 });
    }

    // Créer la demande de vendeur
    const { error: insertError } = await supabase
      .from('seller_requests')
      .insert({
        user_id: user.id,
        status: 'pending',
        reason: JSON.stringify({
          business_name: businessName,
          business_type: businessType,
          motivation: motivation
        })
      });

    if (insertError) {
      console.error('Erreur lors de la création de la demande:', insertError);
      return NextResponse.json({ error: 'Erreur lors de la soumission de la demande' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Demande de vendeur soumise avec succès' });
  } catch (error: unknown) {
    console.error('Erreur API seller-request:', error instanceof Error ? error.message : String(error));
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  console.log('API /api/account/seller-request GET appelée');
  try {
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

    // Récupérer la dernière demande de vendeur de l'utilisateur
    const { data: request, error: requestError } = await supabase
      .from('seller_requests')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (requestError && requestError.code !== 'PGRST116') {
      console.error('Erreur lors de la récupération de la demande:', requestError);
      return NextResponse.json({ error: 'Erreur lors de la récupération de la demande' }, { status: 500 });
    }

    // Si aucune demande n'est trouvée, renvoyer une réponse sans erreur
    if (!request) {
      return NextResponse.json({ request: null });
    }

    // Parser les informations de la demande
    const requestDetails = request.reason ? JSON.parse(request.reason) : {};

    return NextResponse.json({ 
      request: {
        status: request.status,
        business_name: requestDetails.business_name,
        business_type: requestDetails.business_type
      } 
    });
  } catch (error: unknown) {
    console.error('Erreur API seller-request:', error instanceof Error ? error.message : String(error));
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
