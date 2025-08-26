import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  try {
    // Vérifier la session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('Erreur middleware:', sessionError);
    }

    // Pour les routes admin, vérifier le rôle
    if (req.nextUrl.pathname.startsWith('/admin')) {
      if (!session) {
        // Pas de session, rediriger vers la connexion
        return NextResponse.redirect(new URL('/auth/sign-in', req.url));
      }

      // Vérifier le rôle dans la table profiles
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();

      if (profileError || !profile || profile.role !== 'admin') {
        // Pas admin, rediriger vers l'accueil
        return NextResponse.redirect(new URL('/', req.url));
      }
    }

    // Rafraîchir la session si elle existe
    if (session) {
      await supabase.auth.refreshSession();
    }

  } catch (e) {
    console.error('Erreur dans le middleware:', e);
  }

  return res;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public (public files)
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
};