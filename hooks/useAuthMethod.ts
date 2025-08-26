"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';

export type AuthMethod = 'email' | 'discord' | 'unknown';

export interface AuthMethodInfo {
  method: AuthMethod;
  canChangePassword: boolean;
  requiresEmailReset: boolean;
  provider?: string;
  loading: boolean;
}

export function useAuthMethod(): AuthMethodInfo {
  const [authInfo, setAuthInfo] = useState<AuthMethodInfo>({
    method: 'unknown',
    canChangePassword: false,
    requiresEmailReset: false,
    loading: true,
  });

  useEffect(() => {
    const detectAuthMethod = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setAuthInfo({
            method: 'unknown',
            canChangePassword: false,
            requiresEmailReset: false,
            loading: false,
          });
          return;
        }

        // Vérifier les métadonnées utilisateur pour déterminer la méthode d'auth
        const userMetadata = user.user_metadata;
        const appMetadata = user.app_metadata;
        
        // Vérifier si l'utilisateur s'est connecté via un provider OAuth
        const provider = appMetadata?.provider || userMetadata?.provider;
        const providers = appMetadata?.providers || [];
        
        console.log('🔍 Détection méthode auth:', {
          provider,
          providers,
          userMetadata,
          appMetadata
        });

        let method: AuthMethod = 'email';
        let canChangePassword = true;
        let requiresEmailReset = false;

        // Vérifier si c'est une connexion Discord
        if (provider === 'discord' || providers.includes('discord') || userMetadata?.provider === 'discord') {
          method = 'discord';
          canChangePassword = false; // Les utilisateurs Discord ne peuvent pas changer directement
          requiresEmailReset = true; // Ils doivent passer par email de réinitialisation
        }

        setAuthInfo({
          method,
          canChangePassword,
          requiresEmailReset,
          provider,
          loading: false,
        });

      } catch (error) {
        console.error('❌ Erreur détection méthode auth:', error);
        setAuthInfo({
          method: 'unknown',
          canChangePassword: false,
          requiresEmailReset: false,
          loading: false,
        });
      }
    };

    detectAuthMethod();

    // Écouter les changements d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      detectAuthMethod();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return authInfo;
}
