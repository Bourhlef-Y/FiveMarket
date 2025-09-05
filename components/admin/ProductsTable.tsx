"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "@/hooks/useToast";
import { 
  Eye, 
  Search, 
  Filter,
  ChevronLeft,
  ChevronRight,
  Package,
  User,
  Calendar,
  DollarSign
} from 'lucide-react';

export interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  framework: string;
  category: string;
  status: 'draft' | 'pending' | 'approved' | 'rejected' | 'suspended';
  download_count: number;
  created_at: string;
  updated_at: string;
  approved_at: string | null;
  approved_by: string | null;
  author_id: string;
  author_username: string;
  author_avatar: string | null;
}

interface ProductsTableProps {
  products: Product[];
  totalCount: number;
  currentPage: number;
  onPageChange: (page: number) => void;
  onSearch: (term: string) => void;
  onStatusFilter: (status: string) => void;
  onCategoryFilter: (category: string) => void;
  pageSize: number;
  loading?: boolean;
}

export default function ProductsTable({
  products,
  totalCount,
  currentPage,
  onPageChange,
  onSearch,
  onStatusFilter,
  onCategoryFilter,
  pageSize,
  loading = false
}: ProductsTableProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    onSearch(value);
  };

  const handleStatusFilter = (value: string) => {
    setStatusFilter(value);
    onStatusFilter(value === 'all' ? '' : value);
  };

  const handleCategoryFilter = (value: string) => {
    setCategoryFilter(value);
    onCategoryFilter(value === 'all' ? '' : value);
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

  const getCategoryBadge = (category: string) => {
    const categoryColors: { [key: string]: string } = {
      'Police': 'bg-blue-100 text-blue-800',
      'Civilian': 'bg-green-100 text-green-800',
      'UI': 'bg-purple-100 text-purple-800',
      'Jobs': 'bg-orange-100 text-orange-800',
      'Vehicles': 'bg-red-100 text-red-800'
    };
    
    return (
      <Badge className={categoryColors[category] || 'bg-gray-100 text-gray-800'}>
        {category}
      </Badge>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(price);
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  const handleViewProduct = (productId: string) => {
    router.push(`/admin/products/${productId}`);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#FF7101]"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filtres et recherche */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Rechercher par titre ou description..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Select value={statusFilter} onValueChange={handleStatusFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="draft">Brouillon</SelectItem>
            <SelectItem value="pending">En attente</SelectItem>
            <SelectItem value="approved">Approuvé</SelectItem>
            <SelectItem value="rejected">Rejeté</SelectItem>
            <SelectItem value="suspended">Suspendu</SelectItem>
          </SelectContent>
        </Select>

        <Select value={categoryFilter} onValueChange={handleCategoryFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Catégorie" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les catégories</SelectItem>
            <SelectItem value="Police">Police</SelectItem>
            <SelectItem value="Civilian">Civilian</SelectItem>
            <SelectItem value="UI">UI</SelectItem>
            <SelectItem value="Jobs">Jobs</SelectItem>
            <SelectItem value="Vehicles">Vehicles</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tableau des produits */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Produit</TableHead>
              <TableHead>Auteur</TableHead>
              <TableHead>Prix</TableHead>
              <TableHead>Catégorie</TableHead>
              <TableHead>Framework</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Téléchargements</TableHead>
              <TableHead>Créé le</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                  <Package className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  Aucun produit trouvé
                </TableCell>
              </TableRow>
            ) : (
              products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium line-clamp-1">{product.title}</div>
                      <div className="text-sm text-gray-500 line-clamp-2">
                        {product.description}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Avatar className="w-6 h-6">
                        <AvatarImage src={product.author_avatar || undefined} />
                        <AvatarFallback className="text-xs">
                          {product.author_username.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm">{product.author_username}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      <DollarSign className="w-4 h-4 text-green-600" />
                      <span className="font-medium">{formatPrice(product.price)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {getCategoryBadge(product.category)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{product.framework}</Badge>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(product.status)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1">
                      <Package className="w-4 h-4 text-gray-400" />
                      <span>{product.download_count}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-1 text-sm text-gray-500">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(product.created_at)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewProduct(product.id)}
                        className="border-[#FF7101] text-[#FF7101] hover:bg-[#FF7101] hover:text-white"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Voir
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Affichage de {((currentPage - 1) * pageSize) + 1} à {Math.min(currentPage * pageSize, totalCount)} sur {totalCount} produits
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm">
              Page {currentPage} sur {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
