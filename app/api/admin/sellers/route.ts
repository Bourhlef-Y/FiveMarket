import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  console.log('API /api/admin/sellers GET appelée');
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const search = searchParams.get('search') || '';
    console.log(`Page: ${page}, Recherche: ${search}`);
    const pageSize = 10;

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
    console.log('Utilisateur authentifié:', user?.id);
    if (authError) {
      console.error('Erreur d\'authentification:', authError);
      throw authError;
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user?.id)
      .single();

    console.log('Profil utilisateur:', profile);
    if (profileError) {
      console.error('Erreur de récupération du profil:', profileError);
    }

    if (profileError || profile?.role !== 'admin') {
      console.log('Utilisateur non autorisé');
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    // Calculer l'offset pour la pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    // Récupérer les demandes de vendeurs
    let requestsQuery = supabase
      .from('seller_requests')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    const { data: requestsData, error: requestsError, count } = await requestsQuery;

    if (requestsError) {
      console.error('Erreur récupération demandes de vendeurs:', requestsError.message || requestsError.details || requestsError);
      throw requestsError;
    }

    // Si aucune demande, retourner une liste vide
    if (!requestsData || requestsData.length === 0) {
      return NextResponse.json({
        requests: [],
        totalCount: count || 0
      });
    }

    // Récupérer les profils des utilisateurs
    const userIds = requestsData.map(req => req.user_id);
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('id, username, avatar, auth_email')
      .in('id', userIds);

    if (profilesError) {
      console.error('Erreur récupération profils:', profilesError);
      throw profilesError;
    }

    // Créer un map des profils pour un accès rapide
    const profilesMap = new Map(profilesData?.map(profile => [profile.id, profile]) || []);

    // Fonction pour formater le type d'entreprise
    const formatBusinessType = (type: string) => {
      const typeMap: { [key: string]: string } = {
        'small_business': 'Petite entreprise',
        'medium_business': 'Entreprise moyenne',
        'large_business': 'Grande entreprise',
        'startup': 'Startup',
        'freelancer': 'Freelance',
        'individual': 'Particulier',
        'corporation': 'Société',
        'non_profit': 'Organisation à but non lucratif',
        'other': 'Autre'
      };
      return typeMap[type] || type;
    };

    // Transformer les données pour correspondre à l'interface SellerRequest
    const requests = requestsData.map((req: any) => {
      const reasonData = req.reason ? JSON.parse(req.reason) : {};
      const profile = profilesMap.get(req.user_id);
      
      return {
        id: req.id,
        user_id: req.user_id,
        username: profile?.username || 'Utilisateur inconnu',
        avatar: profile?.avatar || null,
        email: profile?.auth_email || 'Email non disponible',
        status: req.status,
        created_at: req.created_at,
        updated_at: req.updated_at,
        reason: req.reason,
        business_name: reasonData.business_name || 'Non spécifié',
        business_type: reasonData.business_type ? formatBusinessType(reasonData.business_type) : 'Non spécifié',
        motivation: reasonData.motivation || 'Non spécifié'
      };
    });

    console.log('Requêtes transformées:', requests);

    return NextResponse.json({
      requests,
      totalCount: count || 0
    });
  } catch (error: unknown) {
    console.error('Erreur API demandes de vendeurs:', error instanceof Error ? error.message : String(error));
    return NextResponse.json(
      { error: 'Erreur serveur', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  console.log('API /api/admin/sellers PATCH appelée');
  try {
    const { searchParams } = new URL(request.url);
    const requestId = searchParams.get('id');
    const { status } = await request.json();

    if (!requestId || !['approved', 'rejected'].includes(status)) {
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

    // Mettre à jour le statut de la demande de vendeur
    const { error: updateError } = await supabase
      .from('seller_requests')
      .update({ status })
      .eq('id', requestId);

    if (updateError) {
      console.error('Erreur mise à jour demande de vendeur:', updateError.message || updateError.details || updateError);
      throw updateError;
    }

    // Si la demande est approuvée, mettre à jour le rôle de l'utilisateur
    if (status === 'approved') {
      // Récupérer l'user_id de la demande
      const { data: requestData, error: requestError } = await supabase
        .from('seller_requests')
        .select('user_id')
        .eq('id', requestId)
        .single();

      if (requestError) {
        console.error('Erreur récupération user_id:', requestError);
        throw requestError;
      }

      // Mettre à jour le rôle de l'utilisateur
      const { error: roleUpdateError } = await supabase
        .from('profiles')
        .update({ role: 'seller' })
        .eq('id', requestData.user_id);

      if (roleUpdateError) {
        console.error('Erreur mise à jour rôle utilisateur:', roleUpdateError.message || roleUpdateError.details || roleUpdateError);
        throw roleUpdateError;
      }
    }

    return NextResponse.json({ message: 'Demande de vendeur mise à jour' });
  } catch (error: unknown) {
    console.error('Erreur API demandes de vendeurs:', error instanceof Error ? error.message : String(error));
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}