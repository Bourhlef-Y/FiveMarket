import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Helper pour créer le client Supabase avec authentification (pour les routes API)
async function createAuthenticatedSupabaseClient(request: Request) {
  const authHeader = request.headers.get('Authorization') || '';
  const hasBearer = authHeader.toLowerCase().startsWith('bearer ');
  const cookieStore = await cookies();

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

export async function GET(request: Request) {
  console.log('API /api/admin/users GET appelée');
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const search = searchParams.get('search') || '';
    console.log(`Page: ${page}, Recherche: ${search}`);
    const pageSize = 10;

    // Remplacer l'initialisation directe par la fonction d'aide
    const supabase = await createAuthenticatedSupabaseClient(request);

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

    // Calculer l'offset pour la pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    // Construire la requête
    let query = supabase
      .from('profiles')
      .select(`
        id,
        username,
        auth_email,
        avatar,
        role,
        created_at,
        discord_username,
        country
      `, { count: 'exact' });

    // Ajouter la recherche si un terme est fourni
    if (search) {
      query = query.or(`username.ilike.%${search}%,discord_username.ilike.%${search}%,auth_email.ilike.%${search}%`);
    }

    // Ajouter la pagination
    const { data: users, error: usersError, count } = await query
      .order('created_at', { ascending: false })
      .range(from, to);

    if (usersError) {
      console.error('Erreur récupération utilisateurs:', usersError.message || usersError.details || usersError);
      throw usersError;
    }

    return NextResponse.json({
      users: users.map((user: any) => ({
        ...user,
        auth_email: user.auth_email // Garder la même structure pour le front
      })),
      totalCount: count || 0
    });
  } catch (error: unknown) {
    console.error('Erreur API users:', error instanceof Error ? error.message : String(error));
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}