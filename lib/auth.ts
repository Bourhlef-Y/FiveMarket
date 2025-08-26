import { createClient } from './supabase-browser';

// Helper pour obtenir l'URL de redirection correcte (selon la doc Supabase)
const getURL = () => {
    let url =
        process?.env?.NEXT_PUBLIC_SITE_URL ?? // URL du site en production
        process?.env?.NEXT_PUBLIC_VERCEL_URL ?? // URL automatique Vercel
        'http://localhost:3000/' // Développement local
    
    // S'assurer que l'URL commence par http
    url = url.startsWith('http') ? url : `https://${url}`
    // S'assurer que l'URL finit par /
    url = url.endsWith('/') ? url : `${url}/`
    
    return url
}

// Fonction pour la connexion Discord OAuth
export const signInWithDiscord = async () => {
    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'discord',
        options: {
            redirectTo: getURL(),
            skipBrowserRedirect: false
        }
    });

    if (error) {
        throw new Error('Erreur lors de la connexion avec Discord');
    }

    return { data, error: null };
};

// Fonction utilitaire pour forcer la synchronisation après OAuth
export const refreshSession = async () => {
    const supabase = createClient();
    const { data, error } = await supabase.auth.refreshSession();
    
    if (error) {
        throw new Error('Erreur lors du rafraîchissement de la session');
    }
    
    return { data, error: null };
};

export const signUp = async (email: string, password: string, username: string) => {
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                username: username,
            },
            emailRedirectTo: `${window.location.origin}/auth/callback`,
        }
    });

    if (error) {
        if (error.message.includes('User already registered')) {
            throw new Error('Un compte existe déjà avec cet email');
        }
        throw new Error('Erreur lors de la création du compte');
    }

    return { user: data.user, error: null };
};

export const signIn = async (email: string, password: string) => {
    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });
    
    if (error) {
        if (error.message.includes('Invalid login credentials')) {
            throw new Error('Email ou mot de passe incorrect');
        } else if (error.message.includes('Email not confirmed')) {
            throw new Error('Email non confirmé');
        }
        throw new Error('Erreur lors de la connexion');
    }
    
    return { user: data.user, error: null };
};

export const signOut = async () => {
    const supabase = createClient();
    const { error } = await supabase.auth.signOut();
    
    if (error) {
        throw new Error('Erreur lors de la déconnexion');
    }
    
    return { error: null };
};