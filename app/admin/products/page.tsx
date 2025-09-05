"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ProductsTable, { Product } from '@/components/admin/ProductsTable';
import { toast } from '@/hooks/useToast';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Package, TrendingUp, Users, DollarSign } from 'lucide-react';

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  
  const { user, profile } = useAuth();
  const router = useRouter();
  
  const pageSize = 10;

  useEffect(() => {
    // Vérifier les autorisations de l'utilisateur
    if (!loading && (!profile || profile.role !== 'admin')) {
      toast({
        title: 'Non autorisé',
        description: 'Vous n\'avez pas les autorisations nécessaires pour accéder à cette page.',
        variant: 'destructive'
      });
      router.push('/');
    }
  }, [profile, loading, router]);

  const loadProducts = async (page: number, search: string = '', status: string = '', category: string = '') => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pageSize.toString(),
        ...(search && { search }),
        ...(status && { status }),
        ...(category && { category })
      });

      const response = await fetch(`/api/admin/products?${params}`);
      
      if (!response.ok) {
        if (response.status === 403) {
          toast({
            title: 'Non autorisé',
            description: 'Vous n\'avez pas les autorisations nécessaires.',
            variant: 'destructive'
          });
          router.push('/');
          return;
        }
        throw new Error('Erreur lors du chargement des produits');
      }

      const data = await response.json();
      setProducts(data.products || []);
      setTotalCount(data.totalCount || 0);
    } catch (error) {
      console.error('Erreur:', error);
      toast({
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Une erreur est survenue',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (profile?.role === 'admin') {
      loadProducts(currentPage, searchTerm, statusFilter === 'all' ? '' : statusFilter, categoryFilter === 'all' ? '' : categoryFilter);
    }
  }, [currentPage, profile]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    setCurrentPage(1);
    loadProducts(1, term, statusFilter === 'all' ? '' : statusFilter, categoryFilter === 'all' ? '' : categoryFilter);
  };

  const handleStatusFilter = (status: string) => {
    setStatusFilter(status);
    setCurrentPage(1);
    loadProducts(1, searchTerm, status === 'all' ? '' : status, categoryFilter);
  };

  const handleCategoryFilter = (category: string) => {
    setCategoryFilter(category);
    setCurrentPage(1);
    loadProducts(1, searchTerm, statusFilter, category === 'all' ? '' : category);
  };

  // Calculer les statistiques
  const stats = {
    total: totalCount,
    approved: products.filter(p => p.status === 'approved').length,
    pending: products.filter(p => p.status === 'pending').length,
    totalRevenue: products.reduce((sum, p) => sum + (p.price * p.download_count), 0)
  };

  if (!profile || profile.role !== 'admin') {
    return null; // Ou un composant de chargement/redirection
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div>
        <h1 className="text-3xl font-bold text-white">Gestion des Produits</h1>
        <p className="text-gray-400 mt-2">
          Gérez et modérez tous les produits de la plateforme
        </p>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-zinc-800/50 border-zinc-700">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Package className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Total Produits</p>
                <p className="text-2xl font-bold text-white">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-800/50 border-zinc-700">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <TrendingUp className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Approuvés</p>
                <p className="text-2xl font-bold text-white">{stats.approved}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-800/50 border-zinc-700">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-yellow-500/20 rounded-lg">
                <Users className="w-6 h-6 text-yellow-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">En Attente</p>
                <p className="text-2xl font-bold text-white">{stats.pending}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-800/50 border-zinc-700">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-emerald-500/20 rounded-lg">
                <DollarSign className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Revenus Totaux</p>
                <p className="text-2xl font-bold text-white">
                  {new Intl.NumberFormat('fr-FR', {
                    style: 'currency',
                    currency: 'EUR'
                  }).format(stats.totalRevenue)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tableau des produits */}
      <Card className="bg-zinc-800/50 border-zinc-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center space-x-2">
            <Package className="w-5 h-5" />
            <span>Liste des Produits</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <ProductsTable
            products={products}
            totalCount={totalCount}
            currentPage={currentPage}
            onPageChange={handlePageChange}
            onSearch={handleSearch}
            onStatusFilter={handleStatusFilter}
            onCategoryFilter={handleCategoryFilter}
            pageSize={pageSize}
            loading={loading}
          />
        </CardContent>
      </Card>
    </div>
  );
}
