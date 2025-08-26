import { createClient } from '@supabase/supabase-js';
import { AuthFlowType } from '@supabase/supabase-js';

// Vérifiez que les variables d'environnement sont définies
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    debug: false, // Logs désactivés pour éviter le spam dans la console
  },
});

// Note: Listener d'authentification supprimé pour éviter les doublons
// Les listeners sont maintenant gérés dans les composants individuels 