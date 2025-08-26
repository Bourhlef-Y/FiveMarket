"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, Camera } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "sonner";
import ImageCropper from "./ImageCropper";

interface AvatarUploadProps {
  avatar: string | null;
  onUpload: (avatar: string) => void;
  email: string;
}

export default function AvatarUpload({ avatar, onUpload, email }: AvatarUploadProps) {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) return;
    
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onload = () => setSelectedImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleCropComplete = async (croppedBlob: Blob) => {
    try {
      setUploading(true);

      if (!user) throw new Error("Vous devez être connecté");

      // Convertir le Blob en base64
      const reader = new FileReader();
      reader.readAsDataURL(croppedBlob);
      reader.onload = async () => {
        const base64Image = reader.result as string;

        // Mettre à jour le profil avec l'image en base64
        const { error: updateError } = await supabase
          .from("profiles")
          .update({ avatar: base64Image })
          .eq("id", user.id);

        if (updateError) throw updateError;

        onUpload(base64Image);
        setSelectedImage(null);
        toast.success("Avatar mis à jour avec succès");
      };

    } catch (error: any) {
      console.error("Erreur lors de l'upload:", error);
      toast.error(error.message || "Erreur lors de l'upload");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {selectedImage ? (
        <ImageCropper
          imageSrc={selectedImage}
          onCropComplete={handleCropComplete}
          onCancel={() => setSelectedImage(null)}
          aspectRatio={1}
          circularCrop
        />
      ) : (
        <div className="relative group">
          <Avatar className="h-24 w-24 cursor-pointer transition-all duration-300 group-hover:brightness-75">
            <AvatarImage src={avatar || undefined} alt="Avatar" />
            <AvatarFallback className="text-2xl">{email?.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>

          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-black/30 rounded-full">
            {uploading ? (
              <Loader2 className="h-6 w-6 animate-spin text-white" />
            ) : (
              <Camera className="h-6 w-6 text-white" />
            )}
          </div>

          <input
            type="file"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleImageSelect}
            disabled={uploading}
          />
        </div>
      )}
    </div>
  );
}