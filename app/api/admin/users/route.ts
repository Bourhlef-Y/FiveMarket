import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const search = searchParams.get('search') || '';
    const pageSize = 10;

    // Attendre les cookies
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

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
        avatar
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

    if (usersError) throw usersError;

    return NextResponse.json({
      users: users.map(user => ({
        ...user,
        auth_email: user.auth_email // Garder la même structure pour le front
      })),
      totalCount: count || 0
    });
  } catch (error) {
    console.error('Erreur API users:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}