import { useState } from 'react';
import { useToast } from '@/hooks/useToast';
import { Resource, ResourceImage } from '@/lib/types';
import { createClient } from '@/lib/supabase/client';
import { v4 as uuidv4 } from 'uuid';

export const useResource = (resourceId?: string) => {
  const [loading, setLoading] = useState(false);
  const [resource, setResource] = useState<Resource | null>(null);
  const { toast } = useToast();
  const supabase = createClient();

  const fetchResource = async () => {
    if (!resourceId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('resources')
        .select('*, profiles:author_id(username, avatar)')
        .eq('id', resourceId)
        .single();

      if (error) throw error;
      setResource(data);
    } catch (error) {
      console.error('Erreur chargement ressource:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger la ressource',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const createResource = async (data: Partial<Resource>) => {
    setLoading(true);
    try {
      // Préparer les images avec des IDs uniques
      const images = data.images?.map((img, index) => ({
        id: uuidv4(),
        image: img.image,
        is_thumbnail: img.is_thumbnail || index === 0,
        upload_order: index + 1,
        created_at: new Date().toISOString()
      }));

      const { data: newResource, error } = await supabase
        .from('resources')
        .insert({
          ...data,
          images,
          status: 'draft'
        })
        .select()
        .single();

      if (error) throw error;
      
      setResource(newResource);
      toast({
        title: 'Succès',
        description: 'Ressource créée avec succès',
        variant: 'success'
      });
      
      return newResource;
    } catch (error) {
      console.error('Erreur création ressource:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de créer la ressource',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const updateResource = async (data: Partial<Resource>) => {
    if (!resourceId) return;
    
    setLoading(true);
    try {
      // Si on met à jour les images
      let images = data.images;
      if (images) {
        // Garder les images existantes qui ne sont pas dans la mise à jour
        const existingImages = resource?.images?.filter(
          img => !images?.find(newImg => newImg.id === img.id)
        ) || [];

        // Ajouter/mettre à jour les nouvelles images
        images = [
          ...existingImages,
          ...images.map((img, index) => ({
            id: img.id || uuidv4(),
            image: img.image,
            is_thumbnail: img.is_thumbnail,
            upload_order: img.upload_order || existingImages.length + index + 1,
            created_at: img.created_at || new Date().toISOString()
          }))
        ];

        // Trier par upload_order
        images.sort((a, b) => a.upload_order - b.upload_order);
      }

      const { data: updatedResource, error } = await supabase
        .from('resources')
        .update({
          ...data,
          images,
          updated_at: new Date().toISOString()
        })
        .eq('id', resourceId)
        .select()
        .single();

      if (error) throw error;
      
      setResource(updatedResource);
      toast({
        title: 'Succès',
        description: 'Ressource mise à jour avec succès',
        variant: 'success'
      });
      
      return updatedResource;
    } catch (error) {
      console.error('Erreur mise à jour ressource:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de mettre à jour la ressource',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteImage = async (imageId: string) => {
    if (!resourceId || !resource) return;
    
    try {
      // Filtrer l'image à supprimer
      const updatedImages = resource.images
        .filter(img => img.id !== imageId)
        .map((img, index) => ({
          ...img,
          upload_order: index + 1
        }));

      const { error } = await supabase
        .from('resources')
        .update({
          images: updatedImages,
          updated_at: new Date().toISOString()
        })
        .eq('id', resourceId);

      if (error) throw error;
      
      setResource(prev => prev ? {
        ...prev,
        images: updatedImages
      } : null);

      toast({
        title: 'Succès',
        description: 'Image supprimée avec succès',
        variant: 'success'
      });
    } catch (error) {
      console.error('Erreur suppression image:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer l\'image',
        variant: 'destructive'
      });
    }
  };

  const reorderImages = async (newOrder: string[]) => {
    if (!resourceId || !resource) return;
    
    try {
      // Réorganiser les images selon le nouvel ordre
      const updatedImages = newOrder.map((id, index) => {
        const image = resource.images.find(img => img.id === id);
        if (!image) throw new Error('Image non trouvée');
        return {
          ...image,
          upload_order: index + 1
        };
      });

      const { error } = await supabase
        .from('resources')
        .update({
          images: updatedImages,
          updated_at: new Date().toISOString()
        })
        .eq('id', resourceId);

      if (error) throw error;
      
      setResource(prev => prev ? {
        ...prev,
        images: updatedImages
      } : null);
    } catch (error) {
      console.error('Erreur réorganisation images:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de réorganiser les images',
        variant: 'destructive'
      });
    }
  };

  return {
    resource,
    loading,
    fetchResource,
    createResource,
    updateResource,
    deleteImage,
    reorderImages
  };
};
