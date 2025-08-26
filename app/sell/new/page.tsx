"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle, ArrowLeft } from 'lucide-react';
import ResourceForm from '@/components/ResourceForm';
import { CreateResourceFormData } from '@/lib/types';
import { uploadMultipleImages, uploadResourceFile } from '@/lib/uploadUtils';
import { toast } from '@/hooks/useToast';

export default function NewResourcePage() {
  const router = useRouter();
  const { user, profile, loading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (formData: CreateResourceFormData) => {
    if (!user || !profile) {
      toast({
        title: 'Session expirée',
        description: 'Votre session a expiré. Veuillez vous reconnecter.',
        variant: 'destructive'
      });
      router.push('/auth/sign-in');
      return;
    }

    setIsLoading(true);

    try {
      console.log('Début création ressource pour:', user.email);
      
      // 1. Créer d'abord la ressource en base
      const response = await fetch('/api/resources', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
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

      console.log('Réponse API:', response.status, response.statusText);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la création');
      }

      const { resource } = await response.json();
      const resourceId = resource.id;

      // 2. Upload des images
      if (formData.images.length > 0) {
        try {
          const imageResults = await uploadMultipleImages(
            formData.images,
            user.id,
            resourceId
          );

          // Préparer les données des images pour la base
          const imagesToSave = imageResults
            .filter(result => result.url && !result.error)
            .map((result, index) => ({
              image_url: result.url, // Base64 string
              is_thumbnail: index === 0,
              upload_order: index + 1
            }));

          // Sauvegarder les images en base
          if (imagesToSave.length > 0) {
            const imageResponse = await fetch(`/api/resources/${resourceId}/images`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              credentials: 'include',
              body: JSON.stringify({ images: imagesToSave }),
            });

            if (!imageResponse.ok) {
              const imageError = await imageResponse.json();
              console.error('Erreur sauvegarde images:', imageError);
              throw new Error(imageError.error || 'Erreur lors de la sauvegarde des images');
            }

            console.log('Images sauvegardées avec succès dans JSONB');
          }
        } catch (imageError) {
          console.error('Erreur upload images:', imageError);
          toast({
            title: 'Attention',
            description: 'La ressource a été créée mais certaines images n\'ont pas pu être uploadées',
            variant: 'warning'
          });
        }
      }

      // 3. Upload du fichier de ressource (pour non-escrow)
      if (formData.resource_type === 'non_escrow' && formData.resourceFile) {
        try {
          const fileResult = await uploadResourceFile(
            formData.resourceFile,
            user.id,
            resourceId
          );

          // Sauvegarder le fichier en base
          const fileResponse = await fetch(`/api/resources/${resourceId}/files`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({
              file_url: fileResult.url,
              file_name: formData.resourceFile.name,
              file_size: formData.resourceFile.size,
              file_type: formData.resourceFile.type
            }),
          });

          if (!fileResponse.ok) {
            const fileError = await fileResponse.json();
            console.error('Erreur sauvegarde fichier:', fileError);
            throw new Error(fileError.error || 'Erreur lors de la sauvegarde du fichier');
          }

          console.log('Fichier sauvegardé avec succès');
        } catch (fileError) {
          console.error('Erreur upload fichier:', fileError);
          toast({
            title: 'Attention',
            description: 'La ressource a été créée mais le fichier n\'a pas pu être uploadé',
            variant: 'warning'
          });
        }
      }

      toast({
        title: 'Ressource créée avec succès !',
        description: 'Votre ressource est maintenant en attente de modération',
        variant: 'success'
      });

      // Rediriger vers la page de gestion des ressources
      router.push('/account?tab=resources');

    } catch (error) {
      console.error('Erreur création ressource:', error);
      toast({
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Une erreur est survenue',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    router.push('/sell');
  };

  // Afficher le chargement pendant la vérification de l'authentification
  if (authLoading) {
    return (
      <div className="min-h-screen bg-zinc-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#FF7101] mx-auto mb-4" />
          <p className="text-zinc-400">Vérification de l'authentification...</p>
        </div>
      </div>
    );
  }

  // Rediriger si non connecté
  if (!user || !profile) {
    router.push('/auth/sign-in');
    return null;
  }

  // Vérifier le rôle
  if (!['seller', 'admin'].includes(profile.role)) {
    return (
      <div className="min-h-screen bg-zinc-900 p-6">
        <div className="max-w-2xl mx-auto pt-20">
          <Card className="bg-zinc-800/50 border-zinc-700">
            <CardContent className="p-8 text-center">
              <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-4">
                Accès vendeur requis
              </h2>
              <p className="text-zinc-400 mb-6">
                Vous devez avoir le statut de vendeur pour créer des ressources. 
                Contactez l'équipe pour demander une promotion de votre compte.
              </p>
              <div className="flex justify-center gap-4">
                <Button 
                  variant="outline"
                  onClick={() => router.push('/sell')}
                  className="border-zinc-700 text-zinc-300"
                >
                  En savoir plus
                </Button>
                <Button 
                  onClick={() => router.push('/account')}
                  className="bg-[#FF7101] hover:bg-[#FF7101]/90"
                >
                  Mon compte
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* En-tête avec navigation */}
      <div className="border-b border-zinc-800 bg-zinc-900/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/sell')}
                className="text-zinc-400 hover:text-white"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Retour
              </Button>
              <div>
                <h1 className="text-lg font-semibold text-white">Nouvelle ressource</h1>
                <p className="text-sm text-zinc-400">Ajoutez une nouvelle ressource à vendre</p>
              </div>
            </div>
            
            <div className="text-right">
              <p className="text-sm text-zinc-400">Connecté en tant que</p>
              <p className="text-sm font-medium text-white">{user.email}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Contenu principal */}
      <div className="py-8">
        <ResourceForm
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}