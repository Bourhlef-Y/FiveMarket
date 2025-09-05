"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/useToast';
import { 
  Package, 
  Plus,
  Eye,
  Edit,
  Trash2,
  Search,
  Filter,
  ArrowLeft,
  Download,
  Calendar,
  DollarSign,
  TrendingUp,
  MoreHorizontal
} from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  status: 'draft' | 'pending' | 'approved' | 'rejected' | 'suspended';
  download_count: number;
  created_at: string;
  updated_at: string;
  category: string;
  framework: string;
  tags: string[];
  image_url?: string;
}

export default function SellerProducts() {
  const router = useRouter();
  const { user, profile, loading } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    if (!loading && profile?.role !== 'seller') {
      toast({
        title: 'Accès refusé',
        description: 'Vous devez être vendeur pour accéder à cette page.',
        variant: 'destructive'
      });
      router.push('/account');
      return;
    }

    if (profile?.role === 'seller') {
      loadProducts();
    }
  }, [profile, loading, router, currentPage, statusFilter, categoryFilter, sortBy, sortOrder]);

  useEffect(() => {
    // Filtrer les produits selon le terme de recherche
    if (searchTerm) {
      const filtered = products.filter(product =>
        product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.framework.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredProducts(filtered);
    } else {
      setFilteredProducts(products);
    }
  }, [searchTerm, products]);

  const loadProducts = async () => {
    try {
      setLoadingData(true);
      
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(categoryFilter !== 'all' && { category: categoryFilter }),
        sortBy,
        sortOrder
      });

      const response = await fetch(`/api/seller/products?${params}`);
      if (response.ok) {
        const data = await response.json();
        setProducts(data.products || []);
        setTotalPages(data.totalPages || 1);
        setTotalCount(data.totalCount || 0);
      } else {
        console.error('Erreur API produits:', response.status, response.statusText);
        toast({
          title: 'Erreur',
          description: 'Impossible de charger vos produits',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Erreur lors du chargement des produits:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger vos produits',
        variant: 'destructive'
      });
    } finally {
      setLoadingData(false);
    }
  };



  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Approuvé</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">En attente</Badge>;
      case 'rejected':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Rejeté</Badge>;
      case 'suspended':
        return <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">Suspendu</Badge>;
      default:
        return <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30">Brouillon</Badge>;
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(price);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handleDeleteProduct = async (productId: string) => {
    try {
      const response = await fetch(`/api/seller/products/${productId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast({
          title: 'Produit supprimé',
          description: 'Le produit a été supprimé avec succès',
          variant: 'default'
        });
        loadProducts();
      } else {
        throw new Error('Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('Erreur lors de la suppression du produit:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer le produit',
        variant: 'destructive'
      });
    }
  };

  const handleStatusChange = async (productId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/seller/products/${productId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        toast({
          title: 'Statut mis à jour',
          description: 'Le statut du produit a été mis à jour',
          variant: 'default'
        });
        loadProducts();
      } else {
        throw new Error('Erreur lors de la mise à jour');
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de mettre à jour le statut',
        variant: 'destructive'
      });
    }
  };

  if (loading || loadingData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#FF7101] mx-auto"></div>
      </div>
    );
  }

  if (!profile || (profile.role !== 'seller' && profile.role !== 'admin')) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* En-tête */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/seller')}
              className="border-zinc-600 text-zinc-300 hover:bg-zinc-700"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-white">Gestion des Produits</h1>
              <p className="text-gray-400 mt-2">
                Gérez tous vos produits et suivez leurs performances
              </p>
            </div>
          </div>
          <Button 
            onClick={() => router.push('/sell/new')}
            className="bg-[#FF7101] hover:bg-[#FF7101]/90 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nouveau Produit
          </Button>
        </div>
      </div>

      {/* Statistiques rapides */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card className="bg-zinc-800/50 border-zinc-700">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-blue-500/20 rounded-lg">
                <Package className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Total Produits</p>
                <p className="text-2xl font-bold text-white">{totalCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-800/50 border-zinc-700">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-green-500/20 rounded-lg">
                <TrendingUp className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Approuvés</p>
                <p className="text-2xl font-bold text-white">
                  {products.filter(p => p.status === 'approved').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-800/50 border-zinc-700">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-yellow-500/20 rounded-lg">
                <Calendar className="w-6 h-6 text-yellow-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">En Attente</p>
                <p className="text-2xl font-bold text-white">
                  {products.filter(p => p.status === 'pending').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-800/50 border-zinc-700">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-emerald-500/20 rounded-lg">
                <Download className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Téléchargements</p>
                <p className="text-2xl font-bold text-white">
                  {products.reduce((sum, p) => sum + p.download_count, 0)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres et recherche */}
      <Card className="bg-zinc-800/50 border-zinc-700 mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Rechercher dans vos produits..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-zinc-900/50 border-zinc-700"
                />
              </div>
            </div>
            <div className="flex gap-4">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40 bg-zinc-900/50 border-zinc-700">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="approved">Approuvé</SelectItem>
                  <SelectItem value="pending">En attente</SelectItem>
                  <SelectItem value="rejected">Rejeté</SelectItem>
                  <SelectItem value="suspended">Suspendu</SelectItem>
                  <SelectItem value="draft">Brouillon</SelectItem>
                </SelectContent>
              </Select>

              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-40 bg-zinc-900/50 border-zinc-700">
                  <SelectValue placeholder="Catégorie" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les catégories</SelectItem>
                  <SelectItem value="Police">Police</SelectItem>
                  <SelectItem value="UI">UI</SelectItem>
                  <SelectItem value="Vehicles">Véhicules</SelectItem>
                  <SelectItem value="Jobs">Jobs</SelectItem>
                  <SelectItem value="Scripts">Scripts</SelectItem>
                </SelectContent>
              </Select>

              <Select value={`${sortBy}-${sortOrder}`} onValueChange={(value) => {
                const [field, order] = value.split('-');
                setSortBy(field);
                setSortOrder(order);
              }}>
                <SelectTrigger className="w-48 bg-zinc-900/50 border-zinc-700">
                  <SelectValue placeholder="Trier par" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="created_at-desc">Plus récent</SelectItem>
                  <SelectItem value="created_at-asc">Plus ancien</SelectItem>
                  <SelectItem value="title-asc">Titre A-Z</SelectItem>
                  <SelectItem value="title-desc">Titre Z-A</SelectItem>
                  <SelectItem value="price-desc">Prix décroissant</SelectItem>
                  <SelectItem value="price-asc">Prix croissant</SelectItem>
                  <SelectItem value="download_count-desc">Plus téléchargé</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Liste des produits */}
      <Card className="bg-zinc-800/50 border-zinc-700">
        <CardHeader>
          <CardTitle className="text-white">
            Mes Produits ({filteredProducts.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredProducts.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">
                {searchTerm || statusFilter !== 'all' || categoryFilter !== 'all' 
                  ? 'Aucun produit trouvé' 
                  : 'Aucun produit pour le moment'
                }
              </h3>
              <p className="text-gray-400 mb-6">
                {searchTerm || statusFilter !== 'all' || categoryFilter !== 'all'
                  ? 'Essayez de modifier vos filtres de recherche'
                  : 'Commencez par créer votre premier produit'
                }
              </p>
              {!searchTerm && statusFilter === 'all' && categoryFilter === 'all' && (
                <Button 
                  onClick={() => router.push('/sell/new')}
                  className="bg-[#FF7101] hover:bg-[#FF7101]/90 text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Créer votre premier produit
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredProducts.map((product) => (
                <div key={product.id} className="p-6 bg-zinc-900/50 rounded-lg border border-zinc-700 hover:bg-zinc-900/70 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <h3 className="text-xl font-semibold text-white">{product.title}</h3>
                        {getStatusBadge(product.status)}
                      </div>
                      
                      <p className="text-gray-400 mb-4 line-clamp-2">{product.description}</p>
                      
                      <div className="flex items-center space-x-6 text-sm text-gray-400 mb-4">
                        <div className="flex items-center space-x-2">
                          <DollarSign className="w-4 h-4" />
                          <span>{formatPrice(product.price)}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Download className="w-4 h-4" />
                          <span>{product.download_count} téléchargements</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Package className="w-4 h-4" />
                          <span>{product.category}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span>Framework: {product.framework}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4" />
                          <span>Créé le {formatDate(product.created_at)}</span>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-2">
                        {product.tags.map((tag) => (
                          <Badge key={tag} variant="outline" className="border-zinc-600 text-zinc-400">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-6">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => router.push(`/product/${product.id}`)}
                        className="border-zinc-600 text-zinc-300 hover:bg-zinc-700"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => router.push(`/sell/edit/${product.id}`)}
                        className="border-zinc-600 text-zinc-300 hover:bg-zinc-700"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-red-600 text-red-400 hover:bg-red-600/20"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Supprimer le produit</AlertDialogTitle>
                            <AlertDialogDescription>
                              Êtes-vous sûr de vouloir supprimer "{product.title}" ? Cette action est irréversible.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Annuler</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => handleDeleteProduct(product.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Supprimer
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center space-x-2 mt-8">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="border-zinc-600 text-zinc-300 hover:bg-zinc-700"
          >
            Précédent
          </Button>
          
          <div className="flex items-center space-x-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const page = i + 1;
              return (
                <Button
                  key={page}
                  variant={currentPage === page ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPage(page)}
                  className={currentPage === page 
                    ? "bg-[#FF7101] hover:bg-[#FF7101]/90 text-white" 
                    : "border-zinc-600 text-zinc-300 hover:bg-zinc-700"
                  }
                >
                  {page}
                </Button>
              );
            })}
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="border-zinc-600 text-zinc-300 hover:bg-zinc-700"
          >
            Suivant
          </Button>
        </div>
      )}
    </div>
  );
}
