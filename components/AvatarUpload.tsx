"use client";

import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Edit } from "lucide-react";
import ImageCropper from './ImageCropper';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/hooks/useToast';
import { useAuth } from '@/contexts/AuthContext';

interface AvatarUploadProps {
  avatar: string | null;
  onUpload: (url: string) => void;
  email: string;
}

export default function AvatarUpload({ avatar, onUpload, email }: AvatarUploadProps) {
  const [showCropper, setShowCropper] = useState(false);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleCropComplete = async (croppedBlob: Blob) => {
    if (!user) {
      toast({
        title: "Erreur",
        description: "Vous devez être connecté pour télécharger un avatar",
        variant: "destructive",
      });
      return;
    }

    try {
      setUploading(true);

      // Créer un nom de fichier unique avec l'ID de l'utilisateur
      const timestamp = Date.now();
      const filePath = `avatar-${user.id}/${timestamp}.jpg`;

      // Supprimer l'ancien avatar s'il existe
      if (avatar) {
    
        const oldFilePath = avatar.split('/').slice(-2).join('/'); // Extrait "avatar-[user_id]/file.jpg"
        
        if (oldFilePath.startsWith('avatar-')) {
          const { error: deleteError } = await supabase.storage
            .from('avatars')
            .remove([oldFilePath]);
          
          if (deleteError) {
            console.error('Erreur lors de la suppression de l\'ancien avatar:', deleteError);
          }
        }
      }

      // Uploader le nouvel avatar
  
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, croppedBlob, {
          contentType: 'image/jpeg',
          upsert: true
        });

      if (uploadError) {
        throw uploadError;
      }

      // Obtenir l'URL publique
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      onUpload(publicUrl);
      setShowCropper(false);

    } catch (error: any) {
      console.error('Erreur détaillée:', error);
      toast({
        title: "Erreur",
        description: "Impossible de télécharger l'avatar. Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <Avatar className="h-24 w-24">
          <AvatarImage src={avatar || undefined} alt="Avatar" />
          <AvatarFallback className="bg-zinc-700 text-zinc-300">
            {email.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <Button
          size="icon"
          variant="outline"
          className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-white hover:bg-zinc-700"
          onClick={() => setShowCropper(true)}
          disabled={uploading}
        >
          <Edit className="h-4 w-4" />
        </Button>
      </div>

      {showCropper && (
        <ImageCropper
          onComplete={handleCropComplete}
          onCancel={() => setShowCropper(false)}
          loading={uploading}
        />
      )}
    </div>
  );
}