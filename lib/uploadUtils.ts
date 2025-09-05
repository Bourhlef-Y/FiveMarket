"use client";

import { supabase } from './supabaseClient';
import { ImageUploadProgress, ResourceUploadProgress, FileValidationResult } from './types';
import { validateImageFile } from './resourceValidation';

// Générer un nom de fichier unique
export function generateUniqueFileName(originalName: string, userId: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2);
  const extension = originalName.substring(originalName.lastIndexOf('.'));
  const baseName = originalName.substring(0, originalName.lastIndexOf('.'))
    .replace(/[^a-zA-Z0-9]/g, '_')
    .substring(0, 50);
  
  return `${userId}/${timestamp}_${random}_${baseName}${extension}`;
}

// Upload d'une image avec progression
export async function uploadImage(
  file: File, 
  userId: string, 
  resourceId: string,
  onProgress?: (progress: number) => void
): Promise<{ url: string; publicUrl: string }> {
  // Validation du fichier
  const validation = validateImageFile(file);
  if (!validation.isValid) {
    throw new Error(validation.error);
  }

  if (onProgress) {
    onProgress(10);
  }

  // Créer un nom de fichier unique
  const timestamp = Date.now();
  const fileExt = file.name.split('.').pop();
  const fileName = `${timestamp}.${fileExt}`;
  const filePath = `resources/${resourceId}/${fileName}`;

  if (onProgress) {
    onProgress(50);
  }

  // Upload vers Supabase Storage (comme pour les avatars)
  console.log('Upload vers Supabase Storage:', filePath, file.name, file.type);
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('images')
    .upload(filePath, file, {
      contentType: file.type,
      upsert: true
    });

  if (uploadError) {
    console.error('Erreur upload Supabase:', uploadError);
    throw new Error(`Erreur lors de l'upload: ${uploadError.message}`);
  }

  console.log('Upload réussi:', uploadData);

  if (onProgress) {
    onProgress(80);
  }

  // Obtenir l'URL publique
  const { data: { publicUrl } } = supabase.storage
    .from('images')
    .getPublicUrl(filePath);

  if (onProgress) {
    onProgress(100);
  }

  return {
    url: publicUrl,
    publicUrl: publicUrl
  };
}

// Upload d'un fichier de ressource avec progression
export async function uploadResourceFile(
  file: File, 
  userId: string, 
  resourceId: string,
  onProgress?: (progress: number) => void
): Promise<{ url: string; publicUrl: string }> {
  const fileName = generateUniqueFileName(file.name, userId);
  const filePath = `resources/${resourceId}/files/${fileName}`;

  // Upload vers Supabase Storage
  const { data, error } = await supabase.storage
    .from('resource-assets')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    });

  if (error) {
    console.error('Erreur upload fichier:', error);
    throw new Error(`Erreur lors de l'upload du fichier: ${error.message}`);
  }

  // Obtenir l'URL publique
  const { data: publicUrlData } = supabase.storage
    .from('resource-assets')
    .getPublicUrl(filePath);

  if (onProgress) {
    onProgress(100);
  }

  return {
    url: data.path,
    publicUrl: publicUrlData.publicUrl
  };
}

// Upload multiple d'images avec gestion de la progression
export async function uploadMultipleImages(
  files: File[], 
  userId: string, 
  resourceId: string,
  onProgressUpdate?: (progress: ImageUploadProgress[]) => void
): Promise<ImageUploadProgress[]> {
  const results: ImageUploadProgress[] = files.map(file => ({
    file,
    progress: 0
  }));

  // Fonction pour mettre à jour la progression
  const updateProgress = (index: number, progress: number, url?: string, error?: string) => {
    results[index] = {
      ...results[index],
      progress,
      url,
      error
    };
    if (onProgressUpdate) {
      onProgressUpdate([...results]);
    }
  };

  // Upload des fichiers en parallèle (limité à 3 simultanés pour éviter la surcharge)
  const chunkSize = 3;
  for (let i = 0; i < files.length; i += chunkSize) {
    const chunk = files.slice(i, i + chunkSize);
    const chunkPromises = chunk.map(async (file, chunkIndex) => {
      const globalIndex = i + chunkIndex;
      try {
        updateProgress(globalIndex, 10);
        
        const result = await uploadImage(
          file, 
          userId, 
          resourceId,
          (progress) => updateProgress(globalIndex, progress)
        );
        
        updateProgress(globalIndex, 100, result.publicUrl);
        return result;
      } catch (error) {
        updateProgress(globalIndex, 0, undefined, error instanceof Error ? error.message : 'Erreur inconnue');
        throw error;
      }
    });

    await Promise.all(chunkPromises);
  }

  return results;
}

// Supprimer un fichier du storage
export async function deleteFile(filePath: string): Promise<void> {
  const { error } = await supabase.storage
    .from('resource-assets')
    .remove([filePath]);

  if (error) {
    console.error('Erreur suppression fichier:', error);
    throw new Error(`Erreur lors de la suppression: ${error.message}`);
  }
}

// Obtenir l'URL publique d'un fichier
export function getPublicUrl(filePath: string): string {
  const { data } = supabase.storage
    .from('resource-assets')
    .getPublicUrl(filePath);
  
  return data.publicUrl;
}

// Vérifier si un fichier existe dans le storage
export async function fileExists(filePath: string): Promise<boolean> {
  const { data, error } = await supabase.storage
    .from('resource-assets')
    .list(filePath.substring(0, filePath.lastIndexOf('/')), {
      search: filePath.substring(filePath.lastIndexOf('/') + 1)
    });

  return !error && data && data.length > 0;
}

// Redimensionner une image côté client (optionnel, pour optimiser)
export function resizeImage(
  file: File, 
  maxWidth: number = 1920, 
  maxHeight: number = 1080, 
  quality: number = 0.8
): Promise<File> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      // Calculer les nouvelles dimensions en gardant le ratio
      let { width, height } = img;
      
      if (width > maxWidth) {
        height = (height * maxWidth) / width;
        width = maxWidth;
      }
      
      if (height > maxHeight) {
        width = (width * maxHeight) / height;
        height = maxHeight;
      }

      // Redimensionner l'image
      canvas.width = width;
      canvas.height = height;
      
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const resizedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now()
              });
              resolve(resizedFile);
            } else {
              reject(new Error('Erreur lors du redimensionnement'));
            }
          },
          file.type,
          quality
        );
      } else {
        reject(new Error('Impossible de créer le contexte canvas'));
      }
    };

    img.onerror = () => reject(new Error('Erreur lors du chargement de l\'image'));
    img.src = URL.createObjectURL(file);
  });
}

// Créer une miniature d'image
export function createImageThumbnail(
  file: File, 
  size: number = 300
): Promise<string> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      canvas.width = size;
      canvas.height = size;
      
      if (ctx) {
        // Créer une miniature carrée centrée
        const minDimension = Math.min(img.width, img.height);
        const x = (img.width - minDimension) / 2;
        const y = (img.height - minDimension) / 2;
        
        ctx.drawImage(img, x, y, minDimension, minDimension, 0, 0, size, size);
        
        const thumbnailUrl = canvas.toDataURL('image/jpeg', 0.8);
        resolve(thumbnailUrl);
      } else {
        reject(new Error('Impossible de créer le contexte canvas'));
      }
    };

    img.onerror = () => reject(new Error('Erreur lors du chargement de l\'image'));
    img.src = URL.createObjectURL(file);
  });
}

// Formater la taille d'un fichier
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Obtenir le type de fichier à partir de l'extension
export function getFileTypeFromExtension(filename: string): string {
  const extension = filename.toLowerCase().substring(filename.lastIndexOf('.'));
  
  const typeMap: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.zip': 'application/zip',
    '.rar': 'application/x-rar-compressed',
    '.7z': 'application/x-7z-compressed',
  };
  
  return typeMap[extension] || 'application/octet-stream';
}
