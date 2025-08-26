// Système de rôles
export type UserRole = 'buyer' | 'seller' | 'admin';

export interface RolePermissions {
  canBuy: boolean;
  canSell: boolean;
  canModerate: boolean;
  canManageUsers: boolean;
  canAccessAdmin: boolean;
}

// Permissions par rôle
export const ROLE_PERMISSIONS: Record<UserRole, RolePermissions> = {
  buyer: {
    canBuy: true,
    canSell: false,
    canModerate: false,
    canManageUsers: false,
    canAccessAdmin: false,
  },
  seller: {
    canBuy: true,
    canSell: true,
    canModerate: false,
    canManageUsers: false,
    canAccessAdmin: false,
  },
  admin: {
    canBuy: true,
    canSell: true,
    canModerate: true,
    canManageUsers: true,
    canAccessAdmin: true,
  },
};

// Interface pour le profil utilisateur étendue
export interface UserProfile {
  id: string;
  username: string | null;
  avatar: string | null;
  description: string | null;
  birth_date: string | null;
  country: string | null;
  discord_id: string | null;
  role: UserRole;
}

// Types pour les ressources du marketplace
export type ResourceType = 'escrow' | 'non_escrow';
export type ResourceStatus = 'draft' | 'pending' | 'approved' | 'rejected' | 'suspended';
export type FrameworkType = 'ESX' | 'QBCore' | 'Standalone';
export type ResourceCategory = 'Police' | 'Civilian' | 'UI' | 'Jobs' | 'Vehicles';

// Interface pour les images stockées en JSONB
export interface ResourceImageData {
  id: string;
  image: string;
  is_thumbnail: boolean;
  upload_order: number;
  created_at: string;
}

export interface Resource {
  id: string;
  author_id: string;
  title: string;
  description: string;
  price: number;
  resource_type: ResourceType;
  framework?: FrameworkType;
  category?: ResourceCategory;
  status: ResourceStatus;
  images: ResourceImageData[];
  download_count: number;
  created_at: string;
  updated_at: string;
  approved_at?: string;
  approved_by?: string;
  profiles: {
    username: string;
    avatar: string;
  };
}

export interface ResourceFile {
  id: string;
  resource_id: string;
  file_url: string;
  file_name: string;
  file_size: number;
  file_type?: string;
  created_at: string;
}

export interface ResourceEscrowInfo {
  id: string;
  resource_id: string;
  requires_cfx_id: boolean;
  requires_email: boolean;
  requires_username: boolean;
  stripe_product_id?: string;
  delivery_instructions?: string;
  created_at: string;
}

export interface Order {
  id: string;
  buyer_id: string;
  resource_id: string;
  amount: number;
  status: string;
  buyer_cfx_id?: string;
  buyer_email?: string;
  buyer_username?: string;
  payment_intent_id?: string;
  created_at: string;
  completed_at?: string;
}

// Types pour les formulaires
export interface CreateResourceFormData {
  title: string;
  description: string;
  price: number;
  resource_type: ResourceType;
  framework?: FrameworkType;
  category?: ResourceCategory;
  images: File[];
  resourceFile?: File;
  escrowInfo?: {
    requires_cfx_id: boolean;
    requires_email: boolean;
    requires_username: boolean;
    delivery_instructions?: string;
  };
}

export interface ResourceFormErrors {
  title?: string;
  description?: string;
  price?: string;
  resource_type?: string;
  framework?: string;
  category?: string;
  images?: string;
  resourceFile?: string;
  escrowInfo?: {
    delivery_instructions?: string;
  };
}

// Types pour les validations de fichiers
export interface FileValidationResult {
  isValid: boolean;
  error?: string;
}

export interface ImageUploadProgress {
  file: File;
  progress: number;
  url?: string;
  error?: string;
}

export interface ResourceUploadProgress {
  images: ImageUploadProgress[];
  resourceFile?: {
    file: File;
    progress: number;
    url?: string;
    error?: string;
  };
}