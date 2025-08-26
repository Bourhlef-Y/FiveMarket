"use client";

import { Badge } from '@/components/ui/badge';
import { Crown, Gift, Zap, Star, Percent } from 'lucide-react';

interface ProductBadgesProps {
  badges?: {
    isPromo?: boolean;
    promoPercent?: number;
    isBundle?: boolean;
    isPremium?: boolean;
    isFeatured?: boolean;
    isNew?: boolean;
    customBadges?: Array<{
      label: string;
      color: string;
      bgColor: string;
      icon?: string;
    }>;
  };
  className?: string;
}

export default function ProductBadges({ badges, className = "" }: ProductBadgesProps) {
  if (!badges) return null;

  const {
    isPromo,
    promoPercent,
    isBundle,
    isPremium,
    isFeatured,
    isNew,
    customBadges = []
  } = badges;

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {/* Badge Promo */}
      {isPromo && (
        <Badge className="bg-red-500/10 text-red-400 border-red-500/20 animate-pulse">
          <Percent className="h-3 w-3 mr-1" />
          {promoPercent ? `-${promoPercent}%` : 'PROMO'}
        </Badge>
      )}

      {/* Badge Bundle */}
      {isBundle && (
        <Badge className="bg-purple-500/10 text-purple-400 border-purple-500/20">
          <Gift className="h-3 w-3 mr-1" />
          Bundle
        </Badge>
      )}

      {/* Badge Premium */}
      {isPremium && (
        <Badge className="bg-yellow-500/10 text-yellow-400 border-yellow-500/20">
          <Crown className="h-3 w-3 mr-1" />
          Premium
        </Badge>
      )}

      {/* Badge Featured */}
      {isFeatured && (
        <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20">
          <Star className="h-3 w-3 mr-1" />
          Mis en avant
        </Badge>
      )}

      {/* Badge New */}
      {isNew && (
        <Badge className="bg-green-500/10 text-green-400 border-green-500/20">
          <Zap className="h-3 w-3 mr-1" />
          Nouveau
        </Badge>
      )}

      {/* Badges personnalisés */}
      {customBadges.map((badge, index) => (
        <Badge
          key={index}
          className="border"
          style={{
            backgroundColor: badge.bgColor || 'rgba(113, 113, 122, 0.1)',
            color: badge.color || '#a1a1aa',
            borderColor: badge.color ? `${badge.color}33` : 'rgba(113, 113, 122, 0.2)'
          }}
        >
          {badge.label}
        </Badge>
      ))}
    </div>
  );
}

// Hook pour déterminer automatiquement les badges basés sur les données du produit
export function useProductBadges(product: any) {
  const badges = {
    isNew: false,
    isPromo: false,
    promoPercent: undefined,
    isBundle: false,
    isPremium: false,
    isFeatured: false,
    customBadges: []
  };

  // Nouveau si créé dans les 30 derniers jours
  if (product.created_at) {
    const createdDate = new Date(product.created_at);
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    badges.isNew = createdDate > thirtyDaysAgo;
  }

  // Premium si prix > 50€
  if (product.price > 50) {
    badges.isPremium = true;
  }

  // Bundle si contient plusieurs items (logique future)
  // badges.isBundle = product.bundle_items?.length > 1;

  // Featured si download_count > 100
  if (product.download_count > 100) {
    badges.isFeatured = true;
  }

  // Logique promo basée sur les métadonnées futures
  // if (product.promo_info) {
  //   badges.isPromo = true;
  //   badges.promoPercent = product.promo_info.percent;
  // }

  return badges;
}
