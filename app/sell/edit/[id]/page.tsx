'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { useRole } from '@/hooks/useRole';
import ResourceForm from '@/components/ResourceForm';
import { RoleGuard } from '@/components/RoleGuard';
import { Toaster } from '@/components/ui/toaster';
import { Resource, CreateResourceFormData } from '@/lib/types';
import { supabase } from '@/lib/supabaseClient';
import { uploadMultipleImages } from '@/lib/uploadUtils';

export default function EditResourcePage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { hasRole } = useRole();
  const [resource, setResource] = useState<Resource | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fonction pour supprimer une image
  const handleDeleteImage = async (imageUrl: string) => {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session?.user) {
        throw new Error('Session expirée');
      }

      const response = await fetch(`/api/resources/${resourceId}/images?imageUrl=${encodeURIComponent(imageUrl)}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la suppression');
      }

      // Mettre à jour la ressource locale
      setResource(prev => {
        if (!prev) return prev;
        const updatedImages = (prev.images || []).filter((img: any) => {
          if (typeof img === 'string') {
            try {
              const parsed = JSON.parse(img);
              return parsed.image_url !== imageUrl;
            } catch {
              return img !== imageUrl;
            }
          }
          return img.image_url !== imageUrl;
        });
        return { ...prev, images: updatedImages };
      });

    } catch (error) {
      console.error('Erreur suppression image:', error);
      throw error;
    }
  };

  const resourceId = params?.id as string;

  useEffect(() => {
    if (resourceId) {
      loadResource();
    }
  }, [resourceId]);

  const loadResource = async () => {
    try {
      const response = await fetch(`/api/resources/${resourceId}`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setResource(data.resource);
      } else if (response.status === 404) {
        toast({
          title: 'Produit introuvable',
          description: 'Ce produit n\'existe pas ou vous n\'y avez pas accès',
          variant: 'destructive'
        });
        router.push('/seller/products');
      } else {
        throw new Error('Erreur lors du chargement');
      }
    } catch (error) {
      console.error('Erreur chargement ressource:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger le produit',
        variant: 'destructive'
      });
      router.push('/seller/products');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (formData: CreateResourceFormData) => {
    setIsSubmitting(true);

    try {
      // Vérifier l'authentification en temps réel
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session?.user) {
        console.error('Erreur session:', sessionError);
        toast({
          title: 'Session expirée',
          description: 'Votre session a expiré. Veuillez vous reconnecter.',
          variant: 'destructive'
        });
        router.push('/auth/sign-in');
        return;
      }

      // Mise à jour des informations de base
      const response = await fetch(`/api/resources/${resourceId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        credentials: 'include',
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          price: formData.price,
          resource_type: formData.resource_type,
          framework: formData.framework,
          category: formData.category,
          escrowInfo: formData.escrowInfo
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la mise à jour');
      }

      // Gestion des nouvelles images si ajoutées
      if (formData.images.length > 0) {
        try {
          console.log('Upload des nouvelles images...');
          const imageResults = await uploadMultipleImages(
            formData.images,
            session.user.id,
            resourceId
          );

          // Préparer les données des images pour la base
          const imagesToSave = imageResults
            .filter(result => result.url && !result.error)
            .map((result, index) => ({
              image_url: result.url,
              is_thumbnail: index === 0,
              upload_order: (resource?.images || []).length + index + 1
            }));

          // Sauvegarder les images en base
          if (imagesToSave.length > 0) {
            const imageResponse = await fetch(`/api/resources/${resourceId}/images`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.access_token}`,
              },
              credentials: 'include',
              body: JSON.stringify({ images: imagesToSave }),
            });

            if (!imageResponse.ok) {
              const imageError = await imageResponse.json();
              console.error('Erreur sauvegarde images:', imageError);
              // Ne pas faire échouer la mise à jour pour les images
            } else {
              console.log('Images sauvegardées avec succès');
            }
          }
        } catch (imageError) {
          console.error('Erreur upload images:', imageError);
          // Ne pas faire échouer la mise à jour pour les images
        }
      }

      // Gestion du nouveau fichier si changé
      if (formData.resourceFile) {
        // TODO: Ajouter la logique de remplacement du fichier
        console.log('Nouveau fichier à uploader:', formData.resourceFile);
      }

      toast({
        title: 'Succès',
        description: 'Produit mis à jour avec succès',
        variant: 'success'
      });

      router.push('/seller/products');

    } catch (error) {
      console.error('Erreur mise à jour:', error);
      toast({
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Erreur lors de la mise à jour',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitForReview = async (formData: CreateResourceFormData) => {
    setIsSubmitting(true);

    try {
      // Vérifier l'authentification en temps réel
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session?.user) {
        console.error('Erreur session:', sessionError);
        toast({
          title: 'Session expirée',
          description: 'Votre session a expiré. Veuillez vous reconnecter.',
          variant: 'destructive'
        });
        router.push('/auth/sign-in');
        return;
      }

      // Mise à jour des informations de base avec statut "pending"
      const response = await fetch(`/api/resources/${resourceId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        credentials: 'include',
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          price: formData.price,
          resource_type: formData.resource_type,
          framework: formData.framework,
          category: formData.category,
          escrowInfo: formData.escrowInfo,
          status: 'pending'
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la soumission');
      }

      // Gestion des nouvelles images si ajoutées
      if (formData.images.length > 0) {
        try {
          console.log('Upload des nouvelles images...');
          const imageResults = await uploadMultipleImages(
            formData.images,
            session.user.id,
            resourceId
          );

          // Préparer les données des images pour la base
          const imagesToSave = imageResults
            .filter(result => result.url && !result.error)
            .map((result, index) => ({
              image_url: result.url,
              is_thumbnail: index === 0,
              upload_order: (resource?.images || []).length + index + 1
            }));

          // Sauvegarder les images en base
          if (imagesToSave.length > 0) {
            const imageResponse = await fetch(`/api/resources/${resourceId}/images`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.access_token}`,
              },
              credentials: 'include',
              body: JSON.stringify({ images: imagesToSave }),
            });

            if (!imageResponse.ok) {
              const imageError = await imageResponse.json();
              console.error('Erreur sauvegarde images:', imageError);
              // Ne pas faire échouer la mise à jour pour les images
            } else {
              console.log('Images sauvegardées avec succès');
            }
          }
        } catch (imageError) {
          console.error('Erreur upload images:', imageError);
          // Ne pas faire échouer la mise à jour pour les images
        }
      }

      // Gestion du nouveau fichier si changé
      if (formData.resourceFile) {
        // TODO: Ajouter la logique de remplacement du fichier
        console.log('Nouveau fichier à uploader:', formData.resourceFile);
      }

      toast({
        title: 'Produit soumis',
        description: 'Votre produit a été soumis en attente de validation',
        variant: 'success'
      });

      router.push('/seller/products');

    } catch (error) {
      console.error('Erreur soumission:', error);
      toast({
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Erreur lors de la soumission',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white">
        <div className="max-w-4xl mx-auto p-6">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-[#FF7101]" />
                <span className="ml-3 text-lg">Chargement du produit...</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!resource) {
    return (
      <div className="min-h-screen bg-black text-white">
        <div className="max-w-4xl mx-auto p-6">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="p-6 text-center">
              <h2 className="text-xl font-bold mb-2">Produit introuvable</h2>
              <p className="text-zinc-400 mb-4">
                Ce produit n'existe pas ou vous n'avez pas les droits pour le modifier.
              </p>
              <Button onClick={() => router.push('/seller/products')}>
                Retour à mes produits
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Convertir la ressource au format du formulaire
  const initialFormData: CreateResourceFormData = {
    title: resource.title,
    description: resource.description,
    price: resource.price,
    resource_type: resource.resource_type,
    framework: resource.framework,
    category: resource.category,
    images: [], // Les nouvelles images à ajouter
    resourceFile: undefined, // Le fichier existant sera affiché séparément
    escrowInfo: undefined // TODO: Charger les infos escrow existantes
  };

  // Normaliser les images existantes
  const existingImages = (resource.images || []).map((img: any, index: number) => {
    if (typeof img === 'string') {
      try {
        const parsed = JSON.parse(img);
        return { ...parsed, id: parsed.id || index };
      } catch {
        return { image_url: img, id: index, is_thumbnail: index === 0, upload_order: index + 1 };
      }
    }
    return { ...img, id: img.id || index };
  });

  return (
    <RoleGuard requiredRole="seller">
      <div className="min-h-screen bg-black text-white">
        <div className="max-w-4xl mx-auto p-6 space-y-6">
          {/* En-tête */}
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/seller/products')}
              className="text-zinc-400 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour à mes produits
            </Button>
          </div>

          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white">
                  Modifier le produit: {resource.title}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-zinc-400">Statut:</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    resource.status === 'draft' 
                      ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                      : resource.status === 'pending'
                      ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                      : resource.status === 'approved'
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                      : 'bg-red-500/20 text-red-400 border border-red-500/30'
                  }`}>
                    {resource.status === 'draft' && 'Brouillon'}
                    {resource.status === 'pending' && 'En attente'}
                    {resource.status === 'approved' && 'Approuvé'}
                    {resource.status === 'rejected' && 'Rejeté'}
                  </span>
                </div>
              </div>
              {resource.status === 'draft' && (
                <p className="text-sm text-zinc-400 mt-2">
                  Ce produit est en brouillon. Vous pouvez le sauvegarder ou le soumettre en attente de validation.
                </p>
              )}
            </CardHeader>
            <CardContent>
              <ResourceForm
                initialData={initialFormData}
                onSubmit={resource.status === 'draft' ? handleSubmitForReview : handleSubmit}
                onSaveDraft={resource.status === 'draft' ? handleSubmit : undefined}
                isLoading={isSubmitting}
                mode="edit"
                existingImages={existingImages}
                onDeleteImage={handleDeleteImage}
              />
            </CardContent>
          </Card>
        </div>
        <Toaster />
      </div>
    </RoleGuard>
  );
}
