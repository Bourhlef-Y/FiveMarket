"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { User } from '@supabase/supabase-js';

interface Profile {
  id: string;
  username: string | null;
  email: string | null;
  avatar: string | null;
  role: 'buyer' | 'seller' | 'admin';
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

      useEffect(() => {

    // Écouter les changements de profil
    const profileSubscription = supabase
      .channel('profile-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
          filter: user ? `id=eq.${user.id}` : undefined
        },
        (payload: any) => {
          if (payload.new) {
            console.log('📱 Mise à jour du profil détectée:', payload.new);
            setProfile(payload.new as Profile);
          }
        }
      )
      .subscribe();

    // Fonction pour charger ou créer le profil
    const loadOrCreateProfile = async (currentUser: User) => {
      try {
        // Essayer de récupérer le profil existant avec try/catch spécifique
        let existingProfile = null;
        let fetchError = null;
        
        try {
          const result = await supabase
            .from('profiles')
            .select('*')
            .eq('id', currentUser.id)
            .single();
          
          existingProfile = result.data;
          fetchError = result.error;
        } catch (supabaseError) {
          fetchError = supabaseError;
        }
          
        if (existingProfile) {
          setProfile(existingProfile);
          console.log('✅ Profil existant récupéré:', existingProfile.username, existingProfile.role);
        } else {
          // Créer le profil automatiquement
          const username = currentUser.user_metadata?.full_name || 
                         currentUser.user_metadata?.name || 
                         currentUser.user_metadata?.preferred_username ||
                         currentUser.email?.split('@')[0] || 
                         'Utilisateur';
                         
          const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .insert({
              id: currentUser.id,
              username: username,
              email: currentUser.email,
              avatar: currentUser.user_metadata?.avatar_url,
              role: 'buyer'
            })
            .select()
            .single();
            
          if (createError) {
            console.error('❌ Erreur lors de la création du profil:', createError);
            // Profile par défaut en cas d'erreur
            setProfile({
              id: currentUser.id,
              username: username,
              email: currentUser.email || null,
              avatar: currentUser.user_metadata?.avatar_url || null,
              role: 'buyer'
            });
          } else {
            setProfile(newProfile);
            console.log('✨ Nouveau profil créé:', newProfile.username, newProfile.role);
          }
        }
      } catch (error) {
        console.error('⚠️ Erreur inattendue dans loadOrCreateProfile:', error);
        // Erreur silencieuse
      }
    };

    // Vérifier la session initiale
    const checkInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          setUser(session.user);
          console.log('🔍 Session initiale trouvée pour user:', session.user.email);
          await loadOrCreateProfile(session.user);
        } else {
          console.log('🚫 Pas de session initiale trouvée.');
        }
      } catch (error) {
        console.error('❌ Erreur vérification session initiale:', error);
      } finally {
        setLoading(false);
        console.log('🏁 Fin du chargement initial. Loading state:', false);
      }
    };

    checkInitialSession();

    // Écouter les changements d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: any, session: any) => {
      console.log('🔄 Auth changement détecté:', event);
      if (session?.user) {
        console.log('📱 Session dans listener: Existe');
        setUser(session.user);
        console.log('👤 User dans session:', session.user.email);
        
        // Timeout de sécurité pour éviter le blocage
        Promise.race([
          loadOrCreateProfile(session.user),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Timeout')), 10000)
          )
        ]).then(() => {
          console.log('✅ loadOrCreateProfile terminé avec succès.');
        }).catch(error => {
          console.error('❌ Erreur ou timeout loadOrCreateProfile:', error);
          // Profil par défaut en cas de timeout
          setProfile({
            id: session.user.id,
            username: session.user.email?.split('@')[0] || 'Utilisateur',
            email: session.user.email,
            avatar: session.user.user_metadata?.avatar_url || null,
            role: 'buyer'
          });
        });
      } else {
        console.log('🚫 Session dans listener: N\'existe pas');
        setUser(null);
        setProfile(null);
      }
      
      if (!loading) {
        setLoading(false);
        console.log('🏁 Fin du chargement AuthStateChange. Loading state:', false);
      }
    });

    return () => {
      subscription.unsubscribe();
      profileSubscription.unsubscribe();
    };
  }, [loading]);

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Erreur déconnexion:', error);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      loading,
      signOut
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
