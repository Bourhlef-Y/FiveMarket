import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  console.log('API /api/admin/sellers/[id] GET appelée');
  try {
    const { id: requestId } = await params;

    if (!requestId) {
      return NextResponse.json({ error: 'ID de demande requis' }, { status: 400 });
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

    // Récupérer la demande de vendeur
    const { data: requestData, error: requestError } = await supabase
      .from('seller_requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (requestError) {
      console.error('Erreur récupération demande:', requestError);
      return NextResponse.json({ error: 'Demande non trouvée' }, { status: 404 });
    }

    // Récupérer le profil de l'utilisateur
    const { data: userProfile, error: userProfileError } = await supabase
      .from('profiles')
      .select('id, username, avatar, auth_email, created_at')
      .eq('id', requestData.user_id)
      .single();

    if (userProfileError) {
      console.error('Erreur récupération profil utilisateur:', userProfileError);
    }

    // Parser les détails de la demande
    const reasonData = requestData.reason ? JSON.parse(requestData.reason) : {};

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

    // Construire la réponse
    const response = {
      id: requestData.id,
      user_id: requestData.user_id,
      username: userProfile?.username || 'Utilisateur inconnu',
      avatar: userProfile?.avatar || null,
      email: userProfile?.auth_email || 'Email non disponible',
      status: requestData.status,
      created_at: requestData.created_at,
      updated_at: requestData.updated_at,
      business_name: reasonData.business_name || 'Non spécifié',
      business_type: reasonData.business_type ? formatBusinessType(reasonData.business_type) : 'Non spécifié',
      motivation: reasonData.motivation || 'Non spécifié',
      user_created_at: userProfile?.created_at || null
    };

    return NextResponse.json(response);
  } catch (error: unknown) {
    console.error('Erreur API demande de vendeur:', error instanceof Error ? error.message : String(error));
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
  console.log('API /api/admin/sellers/[id] PATCH appelée');
  try {
    const { id: requestId } = await params;
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
      console.error('Erreur mise à jour demande de vendeur:', updateError);
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
        console.error('Erreur mise à jour rôle utilisateur:', roleUpdateError);
        throw roleUpdateError;
      }
    }

    return NextResponse.json({ message: 'Demande de vendeur mise à jour' });
  } catch (error: unknown) {
    console.error('Erreur API demande de vendeur:', error instanceof Error ? error.message : String(error));
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
