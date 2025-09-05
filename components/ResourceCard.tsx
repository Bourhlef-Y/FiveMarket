import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Shield, Download } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import AddToCartButton from "@/components/AddToCartButton";

interface Resource {
  id: string;
  title: string;
  description: string;
  price: number;
  framework: string;
  category: string;
  resource_type?: 'escrow' | 'non_escrow';
  download_count?: number;
  thumbnail_url?: string;
  images?: any[];
  profiles?: {
    username: string;
    avatar: string;
  };
}

interface ResourceCardProps {
  resource: Resource;
}

export default function ResourceCard({ resource }: ResourceCardProps) {
  // Fonction pour extraire la première image comme thumbnail
  const getThumbnailUrl = () => {
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

  return (
    <Card className="bg-zinc-800/50 border-zinc-700 overflow-hidden transition-all hover:shadow-lg hover:shadow-[#FF7101]/10 hover:border-[#FF7101]/50">
      <div className="relative h-48 w-full overflow-hidden">
        <Image
          src={getThumbnailUrl()}
          alt={resource.title}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover transition-transform hover:scale-105"
        />
        
        {/* Badge de type ressource */}
        <div className="absolute top-2 right-2 flex gap-2">
          {resource.resource_type && (
            <Badge 
              variant={resource.resource_type === 'escrow' ? 'default' : 'secondary'}
              className={`${resource.resource_type === 'escrow' 
                ? 'bg-green-600 hover:bg-green-700 text-white' 
                : 'bg-blue-600 hover:bg-blue-700 text-white'
              } shadow-lg`}
            >
              <Shield className="h-3 w-3 mr-1" />
              {resource.resource_type === 'escrow' ? 'Escrow' : 'Direct'}
            </Badge>
          )}
        </div>

        {/* Badge de popularité */}
        {resource.download_count !== undefined && resource.download_count >= 100 && (
          <div className="absolute top-2 left-2">
            <Badge variant="destructive" className="bg-[#FF7101] hover:bg-[#FF7101]/90 text-white shadow-lg">
              <Download className="h-3 w-3 mr-1" />
              Populaire
            </Badge>
          </div>
        )}
      </div>

      <CardHeader className="p-4 pb-0">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg line-clamp-1 text-white">{resource.title}</CardTitle>
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
                <h4 className="text-sm font-semibold text-white">{resource.profiles?.username}</h4>
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
          
          {/* Affichage du nombre de téléchargements */}
          {resource.download_count !== undefined && (
            <Badge variant="outline" className="border-zinc-700 text-zinc-500">
              <Download className="h-3 w-3 mr-1" />
              {resource.download_count}
            </Badge>
          )}
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-0 flex justify-between items-start gap-3">
        <span className="text-xl font-bold text-[#FF7101] flex-shrink-0">
          {resource.price === 0 ? "Gratuit" : `${resource.price}€`}
        </span>
        <div className="flex flex-col gap-2 min-w-0 flex-1">
          <AddToCartButton
            productId={resource.id}
            price={resource.price}
            className="w-full text-sm"
          />
          <Button asChild variant="outline" size="sm" className="w-full border-zinc-600 text-zinc-300">
            <Link href={`/product/${resource.id}`}>
              Détails
            </Link>
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
} 