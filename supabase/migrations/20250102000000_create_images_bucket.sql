-- Créer le bucket 'images' pour stocker les images des ressources
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'images',
  'images',
  true,
  52428800, -- 50MB
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
);

-- Politique pour permettre l'upload d'images aux utilisateurs authentifiés
CREATE POLICY "Users can upload images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'images' 
  AND auth.role() = 'authenticated'
  
);

-- Politique pour permettre la lecture publique des images
CREATE POLICY "Images are publicly accessible" ON storage.objects
FOR SELECT USING (bucket_id = 'images');

-- Politique pour permettre la suppression d'images aux propriétaires
CREATE POLICY "Users can delete their own images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'images' 
  AND auth.role() = 'authenticated'
  AND auth.uid()::text = (storage.foldername(name))[2]
);