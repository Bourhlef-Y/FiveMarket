"use client";

import { 
  CreateResourceFormData, 
  ResourceFormErrors, 
  FileValidationResult,
  ResourceType 
} from './types';

// Constantes de validation
export const VALIDATION_RULES = {
  title: {
    minLength: 3,
    maxLength: 100,
  },
  description: {
    minLength: 50,
    maxLength: 5000,
  },
  price: {
    min: 0.01,
    max: 999999.99,
  },
  images: {
    maxFiles: 10,
    maxSizePerFile: 5 * 1024 * 1024, // 5 MB
    allowedTypes: ['image/jpeg', 'image/jpg', 'image/png'],
    allowedExtensions: ['.jpg', '.jpeg', '.png'],
  },
  resourceFile: {
    maxSize: 50 * 1024 * 1024, // 50 MB (limite Supabase)
    allowedTypes: ['application/zip', 'application/x-zip-compressed'],
    allowedExtensions: ['.zip'],
  },
} as const;

// Validation du titre
export function validateTitle(title: string): string | undefined {
  if (!title.trim()) {
    return 'Le titre est obligatoire';
  }
  
  if (title.trim().length < VALIDATION_RULES.title.minLength) {
    return `Le titre doit contenir au moins ${VALIDATION_RULES.title.minLength} caractères`;
  }
  
  if (title.length > VALIDATION_RULES.title.maxLength) {
    return `Le titre ne peut pas dépasser ${VALIDATION_RULES.title.maxLength} caractères`;
  }
  
  // Vérifier les caractères interdits
  const forbiddenChars = /[<>:"\/\\|?*\x00-\x1f]/;
  if (forbiddenChars.test(title)) {
    return 'Le titre contient des caractères non autorisés';
  }
  
  return undefined;
}

// Validation de la description
export function validateDescription(description: string): string | undefined {
  if (!description.trim()) {
    return 'La description est obligatoire';
  }
  
  if (description.trim().length < VALIDATION_RULES.description.minLength) {
    return `La description doit contenir au moins ${VALIDATION_RULES.description.minLength} caractères`;
  }
  
  if (description.length > VALIDATION_RULES.description.maxLength) {
    return `La description ne peut pas dépasser ${VALIDATION_RULES.description.maxLength} caractères`;
  }
  
  return undefined;
}

// Validation du prix
export function validatePrice(price: number): string | undefined {
  if (isNaN(price) || price <= 0) {
    return 'Le prix doit être un nombre positif';
  }
  
  if (price < VALIDATION_RULES.price.min) {
    return `Le prix minimum est de ${VALIDATION_RULES.price.min}€`;
  }
  
  if (price > VALIDATION_RULES.price.max) {
    return `Le prix maximum est de ${VALIDATION_RULES.price.max}€`;
  }
  
  // Vérifier que le prix a maximum 2 décimales
  if (!/^\d+(\.\d{1,2})?$/.test(price.toString())) {
    return 'Le prix ne peut avoir que 2 décimales maximum';
  }
  
  return undefined;
}

// Validation du type de ressource
export function validateResourceType(resourceType: ResourceType): string | undefined {
  if (!resourceType) {
    return 'Le type de ressource est obligatoire';
  }
  
  if (!['escrow', 'non_escrow'].includes(resourceType)) {
    return 'Type de ressource invalide';
  }
  
  return undefined;
}

// Validation d'un fichier image
export function validateImageFile(file: File): FileValidationResult {
  // Vérifier la taille
  if (file.size > VALIDATION_RULES.images.maxSizePerFile) {
    return {
      isValid: false,
      error: `L'image "${file.name}" dépasse la taille maximale de 5 MB`
    };
  }
  
  // Vérifier le type MIME
  if (!VALIDATION_RULES.images.allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: `Le format de l'image "${file.name}" n'est pas supporté. Formats acceptés: JPG, PNG`
    };
  }
  
  // Vérifier l'extension
  const extension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
  if (!VALIDATION_RULES.images.allowedExtensions.includes(extension)) {
    return {
      isValid: false,
      error: `L'extension de l'image "${file.name}" n'est pas supportée. Extensions acceptées: .jpg, .jpeg, .png`
    };
  }
  
  return { isValid: true };
}

// Validation de la liste d'images
export function validateImages(images: File[]): string | undefined {
  if (!images || images.length === 0) {
    return 'Au moins une image est requise';
  }
  
  if (images.length > VALIDATION_RULES.images.maxFiles) {
    return `Vous ne pouvez uploader que ${VALIDATION_RULES.images.maxFiles} images maximum`;
  }
  
  // Valider chaque image
  for (const image of images) {
    const validation = validateImageFile(image);
    if (!validation.isValid) {
      return validation.error;
    }
  }
  
  return undefined;
}

// Validation du fichier de ressource
export function validateResourceFile(file: File | undefined, resourceType: ResourceType): string | undefined {
  // Pour les ressources escrow, le fichier n'est pas obligatoire
  if (resourceType === 'escrow') {
    return undefined;
  }
  
  // Pour les ressources non-escrow, le fichier est obligatoire
  if (!file) {
    return 'Le fichier ZIP de la ressource est obligatoire pour les ressources non-escrow';
  }
  
  // Vérifier la taille
  if (file.size > VALIDATION_RULES.resourceFile.maxSize) {
    return 'Le fichier dépasse la taille maximale de 50 MB (limite Supabase)';
  }
  
  // Vérifier le type MIME
  if (!VALIDATION_RULES.resourceFile.allowedTypes.includes(file.type)) {
    return 'Le fichier doit être un archive ZIP';
  }
  
  // Vérifier l'extension
  const extension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
  if (!VALIDATION_RULES.resourceFile.allowedExtensions.includes(extension)) {
    return 'Le fichier doit avoir l\'extension .zip';
  }
  
  return undefined;
}

// Validation de l'email
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Validation de l'ID CFX
export function validateCfxId(cfxId: string): boolean {
  // L'ID CFX est généralement un nombre ou une chaîne alphanumérique
  const cfxIdRegex = /^[a-zA-Z0-9]+$/;
  return cfxIdRegex.test(cfxId) && cfxId.length >= 1 && cfxId.length <= 50;
}

// Validation complète du formulaire
export function validateResourceForm(formData: CreateResourceFormData): ResourceFormErrors {
  const errors: ResourceFormErrors = {};
  
  // Validation des champs de base
  const titleError = validateTitle(formData.title);
  if (titleError) errors.title = titleError;
  
  const descriptionError = validateDescription(formData.description);
  if (descriptionError) errors.description = descriptionError;
  
  const priceError = validatePrice(formData.price);
  if (priceError) errors.price = priceError;
  
  const resourceTypeError = validateResourceType(formData.resource_type);
  if (resourceTypeError) errors.resource_type = resourceTypeError;
  
  // Validation des images
  const imagesError = validateImages(formData.images);
  if (imagesError) errors.images = imagesError;
  
  // Validation du fichier de ressource
  const resourceFileError = validateResourceFile(formData.resourceFile, formData.resource_type);
  if (resourceFileError) errors.resourceFile = resourceFileError;
  
  // Validation des informations escrow
  if (formData.resource_type === 'escrow' && formData.escrowInfo) {
    if (formData.escrowInfo.delivery_instructions && formData.escrowInfo.delivery_instructions.length > 1000) {
      errors.escrowInfo = {
        delivery_instructions: 'Les instructions de livraison ne peuvent pas dépasser 1000 caractères'
      };
    }
  }
  
  return errors;
}

// Vérifier si le formulaire a des erreurs
export function hasFormErrors(errors: ResourceFormErrors): boolean {
  return Object.keys(errors).some(key => {
    const error = errors[key as keyof ResourceFormErrors];
    if (typeof error === 'string') {
      return true;
    }
    if (typeof error === 'object' && error !== null) {
      return Object.keys(error).length > 0;
    }
    return false;
  });
}

// Nettoyer et formater les données du formulaire
export function sanitizeFormData(formData: CreateResourceFormData): CreateResourceFormData {
  return {
    ...formData,
    title: formData.title.trim(),
    description: formData.description.trim(),
    price: Math.round(formData.price * 100) / 100, // Arrondir à 2 décimales
    images: formData.images, // Préserver les images
    resourceFile: formData.resourceFile, // Préserver le fichier de ressource
    escrowInfo: formData.escrowInfo ? {
      ...formData.escrowInfo,
      delivery_instructions: formData.escrowInfo.delivery_instructions?.trim(),
    } : undefined,
  };
}
