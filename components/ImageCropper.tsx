"use client";

import { useState, useCallback } from "react";
import Cropper from "react-easy-crop";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";

interface ImageCropperProps {
  imageSrc: string;
  onCropComplete: (croppedBlob: Blob) => void;
  onCancel: () => void;
  aspectRatio?: number;
  circularCrop?: boolean;
}

export default function ImageCropper({
  imageSrc,
  onCropComplete,
  onCancel,
  aspectRatio = 1,
  circularCrop = false,
}: ImageCropperProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  const onCropChange = useCallback((crop: { x: number; y: number }) => {
    setCrop(crop);
  }, []);

  const onZoomChange = useCallback((zoom: number[]) => {
    setZoom(zoom[0]);
  }, []);

  const onCropCompleteHandler = useCallback(
    (_croppedArea: any, croppedAreaPixels: any) => {
      setCroppedAreaPixels(croppedAreaPixels);
    },
    []
  );

  const createImage = (url: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener("load", () => resolve(image));
      image.addEventListener("error", (error) => reject(error));
      image.src = url;
    });

  const getCroppedImg = async (
    imageSrc: string,
    pixelCrop: any
  ): Promise<Blob> => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      throw new Error("No 2d context");
    }

    // Définir les dimensions du canvas
    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    // Dessiner l'image recadrée
    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height
    );

    // Si crop circulaire, appliquer un masque rond
    if (circularCrop) {
      ctx.globalCompositeOperation = "destination-in";
      ctx.beginPath();
      ctx.arc(
        canvas.width / 2,
        canvas.height / 2,
        canvas.width / 2,
        0,
        2 * Math.PI,
        true
      );
      ctx.fill();
    }

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (!blob) throw new Error("Canvas is empty");
        resolve(blob);
      }, "image/png");
    });
  };

  const handleComplete = async () => {
    try {
      if (!croppedAreaPixels) return;
      const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels);
      onCropComplete(croppedImage);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Recadrer l'image</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="relative w-full h-[300px]">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={aspectRatio}
            onCropChange={onCropChange}
            onCropComplete={onCropCompleteHandler}
            onZoomChange={(z) => setZoom(z)}
            cropShape={circularCrop ? "round" : "rect"}
            showGrid={false}
            objectFit="contain"
          />
        </div>
        <div className="p-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="zoom">Zoom</Label>
            <Slider
              id="zoom"
              value={[zoom]}
              min={1}
              max={3}
              step={0.1}
              onValueChange={onZoomChange}
            />
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end gap-2">
        <Button
          variant="outline"
          onClick={onCancel}
        >
          Annuler
        </Button>
        <Button onClick={handleComplete} variant="default">
          Valider
        </Button>
      </CardFooter>
    </Card>
  );
}