import { createBrowserClient } from '@supabase/ssr';

// Vérifiez que les variables d'environnement sont définies
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Client singleton pour éviter les instances multiples
let supabaseInstance: ReturnType<typeof createBrowserClient> | null = null;

export const supabase = (() => {
  if (!supabaseInstance) {
    supabaseInstance = createBrowserClient(supabaseUrl, supabaseAnonKey);
  }
  return supabaseInstance;
})();

// Note: Listener d'authentification supprimé pour éviter les doublons
// Les listeners sont maintenant gérés dans les composants individuels 