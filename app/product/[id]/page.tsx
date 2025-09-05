"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { ArrowLeft, Heart, Share2, Download, Shield, Star, User, Calendar, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import NavBar from '@/components/NavBar';
import ProductBadges, { useProductBadges } from '@/components/ProductBadges';
import AddToCartButton from '@/components/AddToCartButton';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/hooks/useToast';
import { Resource, ResourceImageData } from '@/lib/types';

interface ExtendedResource extends Resource {
  resource_escrow_info?: {
    requires_cfx_id: boolean;
    requires_email: boolean;
    requires_username: boolean;
    delivery_instructions?: string;
  };
}

export default function ProductPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [product, setProduct] = useState<ExtendedResource | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);

  // Badges dynamiques basés sur les données du produit
  const productBadges = product ? useProductBadges(product) : null;

  useEffect(() => {
    if (params?.id) {
      fetchProduct(params.id as string);
    }
  }, [params?.id]);

  const fetchProduct = async (productId: string) => {
    try {
      setLoading(true);
      console.log('Récupération du produit:', productId);
      
      // Requête simplifiée d'abord pour diagnostiquer (sans filtre status pour débogage)
      const { data: basicData, error: basicError } = await supabase
        .from('resources')
        .select('*')
        .eq('id', productId)
        .single();

      if (basicError) {
        console.error('Erreur requête basique:', basicError);
        toast({
          title: 'Erreur',
          description: `Produit non trouvé: ${basicError.message}`,
          variant: 'destructive'
        });
        router.push('/marketplace');
        return;
      }

      console.log('Données basiques récupérées:', basicData);

      // Puis récupérer les données associées séparément
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, username, avatar, role')
        .eq('id', basicData.author_id)
        .single();
      
      if (profileError) {
        console.error('Erreur récupération profil:', profileError);
      }

      // Les images sont maintenant stockées dans le champ 'images' de la ressource
      const imagesData = basicData.images || [];
      console.log('Images récupérées:', imagesData);

      const { data: escrowData } = await supabase
        .from('resource_escrow_info')
        .select('requires_cfx_id, requires_email, requires_username, delivery_instructions')
        .eq('resource_id', productId)
        .single();

      // Combiner les données
      const combinedData = {
        ...basicData,
        profiles: profileData,
        resource_escrow_info: escrowData
      };

      console.log('Données combinées:', combinedData);

      setProduct(combinedData);
      
      // Trier les images par ordre d'upload, thumbnail en premier
      if (combinedData.images && combinedData.images.length > 0) {
        combinedData.images.sort((a: any, b: any) => {
          if (a.is_thumbnail && !b.is_thumbnail) return -1;
          if (!a.is_thumbnail && b.is_thumbnail) return 1;
          return a.upload_order - b.upload_order;
        });
      }

    } catch (error) {
      console.error('Erreur:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger le produit',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async () => {
    toast({
      title: 'Fonctionnalité en cours',
      description: 'Le système d\'achat sera bientôt disponible',
      variant: 'default'
    });
  };

  const toggleFavorite = () => {
    setIsFavorite(!isFavorite);
    toast({
      title: isFavorite ? 'Retiré des favoris' : 'Ajouté aux favoris',
      description: `${product?.title} ${isFavorite ? 'retiré de' : 'ajouté à'} vos favoris`,
      variant: 'success'
    });
  };

  const formatPrice = (price: number) => {
    return price === 0 ? 'Gratuit' : `${price}€`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <NavBar />
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-zinc-700 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="h-96 bg-zinc-700 rounded"></div>
              <div className="space-y-4">
                <div className="h-8 bg-zinc-700 rounded w-3/4"></div>
                <div className="h-4 bg-zinc-700 rounded w-1/2"></div>
                <div className="h-20 bg-zinc-700 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen">
        <NavBar />
        <div className="container mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Produit non trouvé</h1>
          <Button onClick={() => router.push('/marketplace')}>
            Retour au marketplace
          </Button>
        </div>
      </div>
    );
  }

  const images = product.images || [];
  const currentImage = images[selectedImageIndex];
  
  // Normaliser le format des images (peuvent être des URLs simples, des objets, ou des chaînes JSON)
  const normalizedImages = images.map((img: any, index) => {
    if (typeof img === 'string') {
      // Vérifier si c'est une chaîne JSON
      if (img.startsWith('{') && img.endsWith('}')) {
        try {
          const parsed = JSON.parse(img);
          return { ...parsed, id: parsed.id || index };
        } catch (e) {
          console.error('Erreur parsing JSON image:', e, img);
          return { image_url: img, id: index, is_thumbnail: index === 0, upload_order: index + 1 };
        }
      }
      // URL simple
      return { image_url: img, id: index, is_thumbnail: index === 0, upload_order: index + 1 };
    }
    return img;
  });
  
  const normalizedCurrentImage = normalizedImages[selectedImageIndex];
  
  console.log('Images normalisées:', normalizedImages);
  console.log('Image actuelle normalisée:', normalizedCurrentImage);

  return (
    <div className="min-h-screen">
      <NavBar />
      
      <main className="container mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="text-zinc-400 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
          <span className="text-zinc-500">/</span>
          <span className="text-zinc-400">Marketplace</span>
          <span className="text-zinc-500">/</span>
          <span className="text-white">{product.title}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Gallery */}
          <div className="space-y-4">
            <div className="relative aspect-video bg-zinc-800 rounded-lg overflow-hidden">
              {normalizedCurrentImage && (normalizedCurrentImage.image_url || normalizedCurrentImage.image) ? (
                <Image
                  src={normalizedCurrentImage.image_url || normalizedCurrentImage.image}
                  alt={product.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  priority
                  className="object-cover"
                />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <Package className="h-16 w-16 text-zinc-600" />
                </div>
              )}
            </div>
            
            {normalizedImages.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {normalizedImages.map((image, index) => (
                  <button
                    key={image.id || index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`relative aspect-video bg-zinc-800 rounded overflow-hidden border-2 transition-colors ${
                      selectedImageIndex === index
                        ? 'border-[#FF7101]'
                        : 'border-transparent hover:border-zinc-600'
                    }`}
                  >
                    {(image.image_url || image.image) ? (
                      <Image
                        src={image.image_url || image.image}
                        alt={`${product.title} - Image ${index + 1}`}
                        fill
                        sizes="(max-width: 768px) 25vw, 12.5vw"
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <Package className="h-8 w-8 text-zinc-600" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">{product.title}</h1>
              
              {/* Badges flexibles */}
              {productBadges && (
                <div className="mb-4">
                  <ProductBadges badges={productBadges} className="mb-2" />
                </div>
              )}
              
              <div className="flex items-center gap-4 mb-4">
                <span className="text-3xl font-bold text-[#FF7101]">
                  {formatPrice(product.price)}
                </span>
                {product.resource_type === 'escrow' && (
                  <Badge className="bg-green-500/10 text-green-400 border-green-500/20">
                    <Shield className="h-3 w-3 mr-1" />
                    Escrow
                  </Badge>
                )}
              </div>
            </div>

            {/* Vendor Info */}
            <Card className="bg-zinc-800/50 border-zinc-700">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={product.profiles?.avatar || ''} />
                    <AvatarFallback>
                      {product.profiles?.username?.charAt(0)?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-medium text-white">{product.profiles?.username}</h3>
                    <p className="text-sm text-zinc-400">Vendeur vérifié</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Product Details */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="text-sm text-zinc-400">Framework</p>
                <Badge variant="outline" className="border-zinc-600 text-zinc-300">
                  {product.framework}
                </Badge>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-zinc-400">Catégorie</p>
                <Badge variant="outline" className="border-zinc-600 text-zinc-300">
                  {product.category}
                </Badge>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-zinc-400">Téléchargements</p>
                <p className="text-white font-medium">{product.download_count || 0}</p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-zinc-400">Publié le</p>
                <p className="text-white font-medium">{formatDate(product.created_at)}</p>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <AddToCartButton
                productId={product.id}
                price={product.price}
                className="w-full text-lg py-6"
              />
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={toggleFavorite}
                  className={`flex-1 border-zinc-600 ${
                    isFavorite ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'text-zinc-300'
                  }`}
                >
                  <Heart className={`h-4 w-4 mr-2 ${isFavorite ? 'fill-current' : ''}`} />
                  {isFavorite ? 'Favori' : 'Favoris'}
                </Button>
                <Button variant="outline" className="border-zinc-600 text-zinc-300">
                  <Share2 className="h-4 w-4 mr-2" />
                  Partager
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Product Details Tabs */}
        <Tabs defaultValue="description" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-zinc-800">
            <TabsTrigger value="description">Description</TabsTrigger>
            <TabsTrigger value="requirements">Prérequis</TabsTrigger>
            <TabsTrigger value="reviews">Avis (Bientôt)</TabsTrigger>
          </TabsList>
          
          <TabsContent value="description" className="mt-6">
            <Card className="bg-zinc-800/50 border-zinc-700">
              <CardHeader>
                <CardTitle className="text-white">Description du produit</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-zinc prose-invert max-w-none">
                  <p className="text-zinc-300 whitespace-pre-wrap">{product.description}</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="requirements" className="mt-6">
            <Card className="bg-zinc-800/50 border-zinc-700">
              <CardHeader>
                <CardTitle className="text-white">Prérequis</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium text-white mb-2">Framework requis</h4>
                  <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20">
                    {product.framework}
                  </Badge>
                </div>
                
                {product.resource_escrow_info && (
                  <div>
                    <h4 className="font-medium text-white mb-2">Informations requises pour la livraison</h4>
                    <ul className="space-y-1 text-zinc-300">
                      {product.resource_escrow_info.requires_cfx_id && (
                        <li>• CFX ID (Identifiant FiveM)</li>
                      )}
                      {product.resource_escrow_info.requires_email && (
                        <li>• Adresse email</li>
                      )}
                      {product.resource_escrow_info.requires_username && (
                        <li>• Nom d'utilisateur</li>
                      )}
                    </ul>
                    {product.resource_escrow_info.delivery_instructions && (
                      <div className="mt-3">
                        <h5 className="font-medium text-white mb-1">Instructions de livraison :</h5>
                        <p className="text-zinc-400 text-sm">
                          {product.resource_escrow_info.delivery_instructions}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="reviews" className="mt-6">
            <Card className="bg-zinc-800/50 border-zinc-700">
              <CardContent className="p-8 text-center">
                <Star className="h-12 w-12 text-zinc-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">Système d'avis bientôt disponible</h3>
                <p className="text-zinc-400">
                  Nous travaillons sur un système d'avis et de notation pour améliorer votre expérience d'achat.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
