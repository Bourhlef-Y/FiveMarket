"use client";

import { ReactNode } from 'react';
import { useRole } from '@/hooks/useRole';
import { UserRole } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lock, UserCheck, Crown } from 'lucide-react';

interface RoleGuardProps {
  children: ReactNode;
  requiredRole?: UserRole;
  requiredPermission?: 'canBuy' | 'canSell' | 'canModerate' | 'canManageUsers' | 'canAccessAdmin';
  fallback?: ReactNode;
  showPromotionCard?: boolean;
  hideOnRestricted?: boolean; // Nouveau prop pour cacher complètement au lieu d'afficher une erreur
}

export function RoleGuard({ 
  children, 
  requiredRole, 
  requiredPermission,
  fallback,
  showPromotionCard = false,
  hideOnRestricted = false
}: RoleGuardProps) {
  const { userRole, hasRole, hasPermission, requestPromotion, loading } = useRole();

  // Pendant le chargement
  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#FF7101]"></div>
      </div>
    );
  }

  // Vérifier les permissions
  const hasRequiredRole = requiredRole ? hasRole(requiredRole) : true;
  const hasRequiredPermission = requiredPermission ? hasPermission(requiredPermission) : true;

  // Si l'utilisateur a les permissions
  if (hasRequiredRole && hasRequiredPermission) {
    return <>{children}</>;
  }

  // Si hideOnRestricted est activé, ne rien afficher
  if (hideOnRestricted) {
    return null;
  }

  // Fallback personnalisé
  if (fallback) {
    return <>{fallback}</>;
  }

  // Card de promotion pour buyer -> seller
  if (showPromotionCard && userRole === 'buyer' && requiredRole === 'seller') {
    return (
      <Card className="bg-zinc-800/50 border-zinc-700">
        <CardContent className="p-8 text-center">
          <UserCheck className="h-16 w-16 text-[#FF7101] mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">
            Devenez Vendeur
          </h3>
          <p className="text-zinc-400 mb-6">
            Pour accéder à cette fonctionnalité, vous devez avoir le statut de vendeur. 
            Cela vous permettra de vendre vos ressources sur la plateforme.
          </p>
          <Button 
            className="bg-[#FF7101] hover:bg-[#FF7101]/90 text-white"
            onClick={requestPromotion}
          >
            Devenir Vendeur
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Messages d'erreur par défaut (uniquement pour les admins)
  const getAccessDeniedMessage = () => {
    if (requiredRole === 'admin') {
      return {
        icon: <Crown className="h-16 w-16 text-red-400 mx-auto mb-4" />,
        title: "Accès Administrateur Requis",
        message: "Cette section est réservée aux administrateurs."
      };
    }

    // Pour les vendeurs et autres rôles, ne rien afficher (retourner null)
    return null;
  };

  const accessDeniedContent = getAccessDeniedMessage();

  // Si pas de message d'erreur (pour buyers/sellers), ne rien afficher
  if (!accessDeniedContent) {
    return fallback || null;
  }

  const { icon, title, message } = accessDeniedContent;

  return (
    <Card className="bg-zinc-800/50 border-zinc-700">
      <CardContent className="p-8 text-center">
        {icon}
        <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
        <p className="text-zinc-400">{message}</p>
        {userRole && (
          <p className="text-sm text-zinc-500 mt-4">
            Votre rôle actuel : <span className="text-[#FF7101] font-medium">{userRole}</span>
          </p>
        )}
      </CardContent>
    </Card>
  );
}


