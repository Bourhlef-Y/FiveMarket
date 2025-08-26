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

export default function EditResourcePage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { hasRole } = useRole();
  const [resource, setResource] = useState<Resource | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resourceId = params.id as string;

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
        router.push('/account?tab=resources');
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
      router.push('/account?tab=resources');
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
        // TODO: Ajouter la logique d'upload d'images supplémentaires
        console.log('Nouvelles images à ajouter:', formData.images);
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

      router.push('/account?tab=resources');

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
              <Button onClick={() => router.push('/account?tab=resources')}>
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
    images: [], // Les images existantes seront affichées séparément
    resourceFile: null, // Le fichier existant sera affiché séparément
    escrowInfo: null // TODO: Charger les infos escrow existantes
  };

  return (
    <RoleGuard requiredRole="seller">
      <div className="min-h-screen bg-black text-white">
        <div className="max-w-4xl mx-auto p-6 space-y-6">
          {/* En-tête */}
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/account?tab=resources')}
              className="text-zinc-400 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour à mes produits
            </Button>
          </div>

          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white">
                Modifier le produit: {resource.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResourceForm
                initialData={initialFormData}
                onSubmit={handleSubmit}
                isSubmitting={isSubmitting}
                mode="edit"
              />
            </CardContent>
          </Card>
        </div>
        <Toaster />
      </div>
    </RoleGuard>
  );
}
