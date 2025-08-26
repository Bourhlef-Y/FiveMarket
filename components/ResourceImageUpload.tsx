import { useState, useCallback } from 'react';
import { Upload, X, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ResourceImage } from '@/lib/types';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { cn } from '@/lib/utils';

interface ResourceImageUploadProps {
  images: ResourceImage[];
  onImagesChange: (images: ResourceImage[]) => void;
  onImageDelete?: (imageId: string) => void;
  onReorder?: (newOrder: string[]) => void;
  maxImages?: number;
}

export default function ResourceImageUpload({
  images,
  onImagesChange,
  onImageDelete,
  onReorder,
  maxImages = 10
}: ResourceImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleImageUpload = useCallback(async (files: FileList) => {
    const newFiles = Array.from(files);
    
    // Vérifier le nombre total d'images
    if (images.length + newFiles.length > maxImages) {
      toast({
        title: 'Limite atteinte',
        description: `Vous ne pouvez uploader que ${maxImages} images maximum`,
        variant: 'destructive'
      });
      return;
    }

    // Convertir les fichiers en base64
    const newImages = await Promise.all(
      newFiles.map(async (file, index) => {
        // Convertir en base64
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => reject(reader.error);
          reader.readAsDataURL(file);
        });

        return {
          id: uuidv4(),
          image: base64,
          is_thumbnail: images.length === 0 && index === 0, // Première image = thumbnail
          upload_order: images.length + index + 1,
          created_at: new Date().toISOString()
        };
      })
    );

    onImagesChange([...images, ...newImages]);
  }, [images, maxImages, onImagesChange]);

  const handleDragEnd = useCallback((result: any) => {
    if (!result.destination) return;

    const items = Array.from(images);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Mettre à jour l'ordre
    const reorderedImages = items.map((img, index) => ({
      ...img,
      upload_order: index + 1
    }));

    onImagesChange(reorderedImages);
    if (onReorder) {
      onReorder(reorderedImages.map(img => img.id));
    }
    setIsDragging(false);
  }, [images, onImagesChange, onReorder]);

  const handleSetThumbnail = useCallback((imageId: string) => {
    const updatedImages = images.map(img => ({
      ...img,
      is_thumbnail: img.id === imageId
    }));
    onImagesChange(updatedImages);
  }, [images, onImagesChange]);

  return (
    <div className="space-y-4">
      {/* Zone d'upload */}
      <div
        className={cn(
          "border-2 border-dashed border-zinc-600 rounded-lg p-8 text-center hover:border-[#FF7101]/50 transition-colors cursor-pointer",
          isDragging && "border-[#FF7101] bg-[#FF7101]/10"
        )}
        onClick={() => document.getElementById('image-upload')?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          handleImageUpload(e.dataTransfer.files);
        }}
      >
        <Upload className="w-12 h-12 text-zinc-500 mx-auto mb-4" />
        <p className="text-zinc-300 mb-2">
          Glissez vos images ici ou cliquez pour ajouter
        </p>
        <p className="text-sm text-zinc-500">
          JPG, PNG uniquement • Max {maxImages} images • 5 MB par image
        </p>
      </div>
      
      <input
        id="image-upload"
        type="file"
        accept="image/jpeg,image/png"
        multiple
        onChange={(e) => e.target.files && handleImageUpload(e.target.files)}
        className="hidden"
      />

      {/* Prévisualisation des images */}
      {images.length > 0 && (
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="images" direction="horizontal">
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
              >
                {images.map((image, index) => (
                  <Draggable key={image.id} draggableId={image.id} index={index}>
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                      >
                        <Card className="relative group">
                          <img
                            src={image.image}
                            alt={`Image ${index + 1}`}
                            className="w-full h-32 object-cover rounded-lg border border-zinc-700"
                          />
                          
                          {/* Actions */}
                          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                            <Button
                              type="button"
                              size="sm"
                              variant="secondary"
                              className={cn(
                                "p-1 h-auto",
                                image.is_thumbnail && "bg-[#FF7101] text-white"
                              )}
                              onClick={() => handleSetThumbnail(image.id)}
                            >
                              <Camera className="w-4 h-4" />
                            </Button>
                            
                            <Button
                              type="button"
                              size="sm"
                              variant="destructive"
                              className="p-1 h-auto"
                              onClick={() => onImageDelete?.(image.id)}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>

                          {/* Badge miniature */}
                          {image.is_thumbnail && (
                            <div className="absolute bottom-2 left-2 bg-[#FF7101] text-white text-xs px-2 py-1 rounded">
                              Miniature
                            </div>
                          )}
                        </Card>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      )}
    </div>
  );
}
