"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/useToast";
import { 
  ArrowLeft, 
  Package, 
  User, 
  Calendar, 
  DollarSign, 
  Download,
  Eye,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  FileText
} from 'lucide-react';

interface ProductDetail {
  id: string;
  title: string;
  description: string;
  price: number;
  framework: string;
  category: string;
  status: 'draft' | 'pending' | 'approved' | 'rejected' | 'suspended';
  resource_type: string;
  download_count: number;
  version: string;
  download_url: string;
  thumbnail: string;
  images: any[];
  created_at: string;
  updated_at: string;
  approved_at: string | null;
  approved_by: string | null;
  author_id: string;
  author_username: string;
  author_avatar: string | null;
  author_email: string;
}

export default function AdminProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const productId = params.id as string;

  useEffect(() => {
    if (productId) {
      loadProduct();
    }
  }, [productId]);

  const loadProduct = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/products/${productId}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          toast({
            title: 'Erreur',
            description: 'Produit non trouvé',
            variant: 'destructive',
          });
          router.push('/admin/products');
          return;
        }
        throw new Error('Erreur lors du chargement du produit');
      }

      const data = await response.json();
      setProduct(data);
    } catch (error) {
      console.error('Erreur:', error);
      toast({
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Une erreur est survenue',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: 'draft' | 'pending' | 'approved' | 'rejected' | 'suspended') => {
    try {
      setUpdating(true);
      const response = await fetch(`/api/admin/products/${productId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erreur lors de la mise à jour du statut');
      }

      const statusLabels: { [key: string]: string } = {
        'draft': 'Brouillon',
        'pending': 'En attente',
        'approved': 'Approuvé',
        'rejected': 'Rejeté',
        'suspended': 'Suspendu'
      };

      toast({
        title: 'Succès',
        description: `Produit mis à jour: ${statusLabels[newStatus]}`,
        variant: 'default',
      });

      // Recharger les données
      await loadProduct();
    } catch (error) {
      console.error('Erreur:', error);
      toast({
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Une erreur est survenue',
        variant: 'destructive',
      });
    } finally {
      setUpdating(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(price);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge variant="secondary">Brouillon</Badge>;
      case 'pending':
        return <Badge variant="outline">En attente</Badge>;
      case 'approved':
        return <Badge variant="default">Approuvé</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejeté</Badge>;
      case 'suspended':
        return <Badge variant="destructive">Suspendu</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'suspended':
        return <AlertTriangle className="w-5 h-5 text-orange-500" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      default:
        return <FileText className="w-5 h-5 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center space-x-4 mb-6">
          <Button
            variant="outline"
            onClick={() => router.push('/admin/products')}
            className="border-[#FF7101] text-[#FF7101] hover:bg-[#FF7101] hover:text-white"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
          <h1 className="text-2xl font-bold">Chargement...</h1>
        </div>
        <div className="animate-pulse">
          <div className="h-64 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center space-x-4 mb-6">
          <Button
            variant="outline"
            onClick={() => router.push('/admin/products')}
            className="border-[#FF7101] text-[#FF7101] hover:bg-[#FF7101] hover:text-white"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
          <h1 className="text-2xl font-bold">Produit non trouvé</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center space-x-4 mb-6">
        <Button
          variant="outline"
          onClick={() => router.push('/admin/products')}
          className="border-[#FF7101] text-[#FF7101] hover:bg-[#FF7101] hover:text-white"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour
        </Button>
        <h1 className="text-2xl font-bold">Détails du Produit</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Informations principales */}
        <div className="lg:col-span-2 space-y-6">
          {/* Informations produit */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Package className="w-5 h-5" />
                <span>Informations Produit</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-xl font-semibold mb-2">{product.title}</h3>
                <p className="text-gray-700 whitespace-pre-wrap">{product.description}</p>
              </div>
              
              <Separator />
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Prix</label>
                  <p className="text-lg font-semibold text-green-600">{formatPrice(product.price)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Version</label>
                  <p className="text-lg">{product.version || 'Non spécifiée'}</p>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Framework</label>
                  <Badge variant="outline">{product.framework}</Badge>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Catégorie</label>
                  <Badge variant="outline">{product.category}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Images */}
          {product.images && product.images.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Eye className="w-5 h-5" />
                  <span>Images du Produit</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {product.images.map((image: any, index: number) => (
                    <div key={index} className="relative">
                      <img
                        src={image.image_url || image.image}
                        alt={`Image ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg border"
                      />
                      {image.is_thumbnail && (
                        <Badge className="absolute top-2 left-2 bg-blue-500">
                          Miniature
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Statut et actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                {getStatusIcon(product.status)}
                <span>Statut du Produit</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Statut actuel</span>
                {getStatusBadge(product.status)}
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <Calendar className="w-4 h-4" />
                  <span>Créé le {formatDate(product.created_at)}</span>
                </div>
                {product.updated_at !== product.created_at && (
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <Calendar className="w-4 h-4" />
                    <span>Modifié le {formatDate(product.updated_at)}</span>
                  </div>
                )}
                {product.approved_at && (
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <CheckCircle className="w-4 h-4" />
                    <span>Approuvé le {formatDate(product.approved_at)}</span>
                  </div>
                )}
              </div>

              <Separator />

              <div className="space-y-2">
                <Button
                  className="w-full bg-green-600 hover:bg-green-700"
                  onClick={() => handleStatusChange('approved')}
                  disabled={updating || product.status === 'approved'}
                >
                  {updating ? 'Mise à jour...' : 'Approuver'}
                </Button>
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={() => handleStatusChange('rejected')}
                  disabled={updating || product.status === 'rejected'}
                >
                  {updating ? 'Mise à jour...' : 'Rejeter'}
                </Button>
                <Button
                  variant="outline"
                  className="w-full border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white"
                  onClick={() => handleStatusChange('suspended')}
                  disabled={updating || product.status === 'suspended'}
                >
                  {updating ? 'Mise à jour...' : 'Suspendre'}
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => handleStatusChange('pending')}
                  disabled={updating || product.status === 'pending'}
                >
                  {updating ? 'Mise à jour...' : 'Mettre en attente'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Informations auteur */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="w-5 h-5" />
                <span>Auteur</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-4">
                <Avatar className="w-12 h-12">
                  <AvatarImage src={product.author_avatar || undefined} alt={product.author_username} />
                  <AvatarFallback>
                    {product.author_username.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="font-semibold">{product.author_username}</h3>
                  <p className="text-sm text-gray-500">{product.author_email}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Statistiques */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Download className="w-5 h-5" />
                <span>Statistiques</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Téléchargements</span>
                <span className="text-lg font-semibold">{product.download_count}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Revenus générés</span>
                <span className="text-lg font-semibold text-green-600">
                  {formatPrice(product.price * product.download_count)}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Informations techniques */}
          <Card>
            <CardHeader>
              <CardTitle>Informations techniques</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">ID du produit</span>
                <span className="font-mono text-xs">{product.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">ID auteur</span>
                <span className="font-mono text-xs">{product.author_id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Type de ressource</span>
                <span className="text-xs">{product.resource_type}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
