"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { UserRole, RolePermissions, ROLE_PERMISSIONS, UserProfile } from '@/lib/types';

export function useRole() {
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [permissions, setPermissions] = useState<RolePermissions | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        // Récupérer la session utilisateur
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session?.user) {
          setUserRole(null);
          setPermissions(null);
          setUser(null);
          setLoading(false);
          return;
        }

        setUser(session.user);

        // Récupérer le profil avec le rôle
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();

        if (error) {
          console.error('❌ Erreur récupération rôle:', error);
          setUserRole('buyer'); // Valeur par défaut
        } else {
          const role = profile?.role as UserRole || 'buyer';
          setUserRole(role);
          setPermissions(ROLE_PERMISSIONS[role]);
          console.log('🔐 Rôle utilisateur:', role);
        }
      } catch (error) {
        console.error('❌ Erreur useRole:', error);
        setUserRole('buyer');
        setPermissions(ROLE_PERMISSIONS.buyer);
      } finally {
        setLoading(false);
      }
    };

    fetchUserRole();

    // Écouter les changements d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        fetchUserRole();
      } else if (event === 'SIGNED_OUT') {
        setUserRole(null);
        setPermissions(null);
        setUser(null);
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Fonction pour vérifier une permission spécifique
  const hasPermission = (permission: keyof RolePermissions): boolean => {
    return permissions?.[permission] ?? false;
  };

  // Fonction pour vérifier si l'utilisateur a un rôle spécifique ou supérieur
  const hasRole = (requiredRole: UserRole): boolean => {
    if (!userRole) return false;

    const roleHierarchy: Record<UserRole, number> = {
      buyer: 1,
      seller: 2,
      admin: 3,
    };

    return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
  };

  // Fonction pour promouvoir un utilisateur (admin uniquement)
  const promoteUser = async (userId: string, newRole: UserRole): Promise<boolean> => {
    if (!hasPermission('canManageUsers')) {
      console.error('❌ Permission insuffisante pour promouvoir un utilisateur');
      return false;
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) throw error;

      console.log('✅ Utilisateur promu au rôle:', newRole);
      return true;
    } catch (error) {
      console.error('❌ Erreur promotion utilisateur:', error);
      return false;
    }
  };

  // Fonction pour demander une promotion (buyer -> seller)
  const requestPromotion = async (): Promise<boolean> => {
    if (userRole !== 'buyer') {
      console.error('❌ Seuls les buyers peuvent demander une promotion');
      return false;
    }

    try {
      // Pour l'instant, promotion automatique à seller
      // Plus tard, on pourra ajouter un système de demande/approbation
      const { error } = await supabase
        .from('profiles')
        .update({ role: 'seller' })
        .eq('id', user.id);

      if (error) throw error;

      setUserRole('seller');
      setPermissions(ROLE_PERMISSIONS.seller);
      console.log('✅ Promotion vers seller accordée');
      return true;
    } catch (error) {
      console.error('❌ Erreur demande promotion:', error);
      return false;
    }
  };

  return {
    userRole,
    permissions,
    loading,
    hasPermission,
    hasRole,
    promoteUser,
    requestPromotion,
    // Raccourcis pour les permissions courantes
    canBuy: hasPermission('canBuy'),
    canSell: hasPermission('canSell'),
    canModerate: hasPermission('canModerate'),
    canManageUsers: hasPermission('canManageUsers'),
    canAccessAdmin: hasPermission('canAccessAdmin'),
    // Raccourcis pour les rôles
    isBuyer: userRole === 'buyer',
    isSeller: hasRole('seller'),
    isAdmin: userRole === 'admin',
  };
}
