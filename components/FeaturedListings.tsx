"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import Image from "next/image";
import Link from "next/link";
import { Resource } from '@/lib/types';
import { supabase } from '@/lib/supabaseClient';
import { cva } from "class-variance-authority";

const cardTitleVariants = cva("text-white", {
  variants: {
    size: {
      default: "text-lg font-semibold",
      large: "text-xl font-semibold",
      // ... autres variantes
    },
  },
  defaultVariants: {
    size: "default",
  },
});

export default function FeaturedListings() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);

  // Fonction pour extraire la première image comme thumbnail
  const getThumbnailUrl = (resource: Resource) => {
    // Si thumbnail_url existe, l'utiliser
    if (resource.thumbnail_url) {
      return resource.thumbnail_url;
    }
    
    // Sinon, extraire la première image du champ images
    if (resource.images && resource.images.length > 0) {
      const firstImage = resource.images[0];
      
      // Si c'est une chaîne JSON, la parser
      if (typeof firstImage === 'string') {
        try {
          const parsed = JSON.parse(firstImage);
          return parsed.image_url || parsed.image;
        } catch {
          return firstImage; // Si ce n'est pas du JSON, utiliser directement
        }
      }
      
      // Si c'est un objet, utiliser image_url ou image (base64)
      if (typeof firstImage === 'object') {
        if (firstImage.image_url) {
          return firstImage.image_url;
        }
        if (firstImage.image) {
          return firstImage.image; // Base64 image
        }
      }
    }
    
    // Fallback vers placeholder
    return "/placeholder.svg";
  };

  useEffect(() => {
    async function fetchResources() {
      const { data, error } = await supabase
        .from('resources')
        .select(`
          *,
          profiles:author_id (
            username,
            avatar
          )
        `)
        .order('created_at', { ascending: false })
        .limit(8);

      if (error) {
        console.error('Erreur lors de la récupération des ressources:', error);
        return;
      }

      setResources(data || []);
      setLoading(false);
    }

    fetchResources();
  }, []);

  if (loading) {
    return <div>Chargement...</div>;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {resources.map((resource) => (
        <Card
          key={resource.id}
          className="bg-zinc-800/50 border-zinc-700 overflow-hidden transition-all hover:shadow-lg hover:shadow-[#FF7101]/10 hover:border-[#FF7101]/50"
        >
          <div className="relative h-48 w-full overflow-hidden">
            <Image
              src={getThumbnailUrl(resource)}
              alt={resource.title}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
              className="object-cover transition-transform hover:scale-105"
            />
          </div>

          <CardHeader className="p-4 pb-0">
            <div className="flex justify-between items-start">
              <CardTitle className={cardTitleVariants({ size: "default" })}>{resource.title}</CardTitle>
            </div>

            <HoverCard>
              <HoverCardTrigger asChild>
                <div className="flex items-center cursor-pointer">
                  <Avatar className="h-6 w-6 mr-2">
                    <AvatarImage src={resource.profiles?.avatar || "/placeholder.svg"} alt={resource.profiles?.username} />
                    <AvatarFallback>{resource.profiles?.username?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm text-zinc-400">{resource.profiles?.username}</span>
                </div>
              </HoverCardTrigger>
              <HoverCardContent className="w-80 bg-zinc-800 border-zinc-700">
                <div className="flex justify-between space-x-4">
                  <Avatar>
                    <AvatarImage src={resource.profiles?.avatar || "/placeholder.svg"} />
                    <AvatarFallback>{resource.profiles?.username?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="space-y-1">
                    <h4 className="text-sm font-semibold">{resource.profiles?.username}</h4>
                    <p className="text-sm text-zinc-400">Développeur vérifié</p>
                  </div>
                </div>
              </HoverCardContent>
            </HoverCard>

            <CardDescription className="text-zinc-400 line-clamp-2 mt-2">
              {resource.description}
            </CardDescription>
          </CardHeader>

          <CardContent className="p-4 pt-2">
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="border-zinc-700 text-zinc-400">
                {resource.framework}
              </Badge>
              <Badge variant="outline" className="border-zinc-700 text-zinc-400">
                {resource.category}
              </Badge>
            </div>
          </CardContent>

          <CardFooter className="p-4 pt-0 flex justify-between items-center">
            <span className="text-xl font-bold text-[#FF7101]">
              {resource.price === 0 ? "Gratuit" : `${resource.price}€`}
            </span>
            <Button asChild className="bg-zinc-700 hover:bg-zinc-600 text-white">
              <Link href={`/product/${resource.id}`}>
                Voir
              </Link>
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
} 