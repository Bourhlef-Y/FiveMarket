import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

// GET - Récupérer les statistiques de ventes pour un vendeur
export async function GET(request: NextRequest) {
  try {
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
          console.log('Authentification réussie via Bearer token (analytics):', tokenUser.email);
        }
      } catch (tokenError) {
        console.error('Erreur validation token (analytics):', tokenError);
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
          console.log('Authentification réussie via cookies (analytics):', user.email);
        }
      } catch (cookieError) {
        console.error('Erreur cookies (analytics):', cookieError);
      }
    }
    
    if (!user || !supabase) {
      console.error('Erreur auth analytics - aucune méthode fonctionnelle');
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const authorId = searchParams.get('author_id') || user.id;

    // Vérifier que l'utilisateur peut accéder à ces stats (propriétaire ou admin)
    if (authorId !== user.id) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profile?.role !== 'admin') {
        return NextResponse.json(
          { error: 'Non autorisé' },
          { status: 403 }
        );
      }
    }

    // Calculer les statistiques
    // Version sécurisée qui fonctionne même si la table orders n'est pas complètement configurée
    let totalSales = 0;
    let totalRevenue = 0;
    let monthlySales = 0;
    let monthlyRevenue = 0;

    try {
      // Utiliser la vue sécurisée en priorité
      const { data: safeStats, error: safeError } = await supabase
        .from('seller_sales_stats_safe')
        .select('*')
        .eq('author_id', authorId)
        .single();

      if (!safeError && safeStats) {
        // Utiliser les statistiques de la vue sécurisée
        totalSales = safeStats.total_orders || 0;
        totalRevenue = parseFloat(safeStats.total_revenue) || 0;
        monthlySales = safeStats.monthly_orders || 0;
        monthlyRevenue = parseFloat(safeStats.monthly_revenue) || 0;
      } else {
        // Fallback : Essayer d'accéder directement à la table orders
        const { data: orderCheck } = await supabase
          .from('orders')
          .select('id')
          .limit(1);

        if (orderCheck !== null) {
          // La table orders existe et est accessible
          console.log('Table orders accessible, mais pas de statistiques pour ce vendeur');
        } else {
          console.log('Table orders non accessible, utilisation des valeurs par défaut');
        }
      }
    } catch (error) {
      // Toute erreur = utiliser des valeurs par défaut
      console.log('Erreur lors du calcul des statistiques, utilisation des valeurs par défaut:', error);
    }

    const stats = {
      totalRevenue,
      totalSales,
      monthlyRevenue,
      monthlySales
    };

    return NextResponse.json({ stats });

  } catch (error) {
    console.error('Erreur API analytics:', error);
    return NextResponse.json(
      { error: 'Erreur serveur interne' },
      { status: 500 }
    );
  }
}
