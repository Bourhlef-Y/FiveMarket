'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { supabase } from '@/lib/supabaseClient';
import { 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff, 
  Plus, 
  TrendingUp, 
  DollarSign,
  Package,
  Users,
  MoreVertical,
  Calendar,
  Tag
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/useToast';
import { useConfirmationDialog } from '@/hooks/useConfirmationDialog';
import { ConfirmationDialog } from '@/components/ConfirmationDialog';
import { Resource } from '@/lib/types';

interface ResourceManagementProps {
  userId: string;
}

interface SalesStats {
  totalRevenue: number;
  totalSales: number;
  monthlyRevenue: number;
  monthlySales: number;
}

const ResourceManagement = ({ userId }: ResourceManagementProps) => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [salesStats, setSalesStats] = useState<SalesStats>({
    totalRevenue: 0,
    totalSales: 0,
    monthlyRevenue: 0,
    monthlySales: 0
  });
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  
  const router = useRouter();
  const { toast } = useToast();
  const { showConfirmationDialog, dialogProps } = useConfirmationDialog();

  // Charger les ressources et statistiques
  useEffect(() => {
    loadUserResources();
    loadSalesStats();
  }, [userId]);

  const loadUserResources = async () => {
    try {
      const response = await fetch(`/api/resources?author_id=${userId}`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setResources(data.resources || []);
      } else {
        toast({
          title: 'Erreur',
          description: 'Impossible de charger vos produits',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Erreur chargement ressources:', error);
      toast({
        title: 'Erreur',
        description: 'Erreur lors du chargement',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const loadSalesStats = async () => {
    try {
      // Récupérer le token de session pour l'authentification
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        console.error('Pas de token de session pour les statistiques');
        return;
      }

      const response = await fetch(`/api/analytics/sales?author_id=${userId}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setSalesStats(data.stats);
      } else {
        console.error('Erreur récupération statistiques:', response.status);
      }
    } catch (error) {
      console.error('Erreur chargement statistiques:', error);
    }
  };

  const toggleResourceStatus = async (resourceId: string, currentStatus: string) => {
    // Mapper les statuts selon l'enum de la DB: 'draft', 'pending', 'approved', 'rejected', 'suspended'
    const newStatus = currentStatus === 'approved' ? 'suspended' : 'approved';
    setUpdatingId(resourceId);

    try {
      // Récupérer le token de session pour l'authentification
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error('Session expirée');
      }

      const response = await fetch(`/api/resources/${resourceId}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        credentials: 'include',
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        setResources(prev => prev.map(resource => 
          resource.id === resourceId 
            ? { ...resource, status: newStatus as any }
            : resource
        ));
        
        toast({
          title: 'Succès',
          description: `Produit ${newStatus === 'approved' ? 'activé' : 'suspendu'}`,
          variant: 'success'
        });
      } else {
        throw new Error('Erreur lors de la mise à jour');
      }
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de modifier le statut',
        variant: 'destructive'
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const deleteResource = async (resourceId: string, title: string) => {
    const confirmed = await showConfirmationDialog({
      title: 'Supprimer le produit',
      description: `Êtes-vous sûr de vouloir supprimer "${title}" ? Cette action est irréversible.`,
      confirmText: 'Supprimer',
      cancelText: 'Annuler',
      variant: 'destructive'
    });

    if (!confirmed) return;

    setUpdatingId(resourceId);

    try {
      // Récupérer le token de session pour l'authentification
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error('Session expirée');
      }

      const response = await fetch(`/api/resources/${resourceId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
        credentials: 'include'
      });

      if (response.ok) {
        setResources(prev => prev.filter(resource => resource.id !== resourceId));
        toast({
          title: 'Succès',
          description: 'Produit supprimé avec succès',
          variant: 'success'
        });
      } else {
        throw new Error('Erreur lors de la suppression');
      }
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer le produit',
        variant: 'destructive'
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/20">Actif</Badge>;
      case 'suspended':
        return <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">Suspendu</Badge>;
      case 'draft':
        return <Badge className="bg-gray-500/10 text-gray-600 border-gray-500/20">Brouillon</Badge>;
      case 'pending':
        return <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20">En attente</Badge>;
      case 'rejected':
        return <Badge className="bg-red-500/10 text-red-600 border-red-500/20">Rejeté</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(new Date(dateString));
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="bg-zinc-900 border-zinc-800">
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-zinc-700 rounded mb-2"></div>
                  <div className="h-8 bg-zinc-700 rounded"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-6 bg-zinc-700 rounded w-48"></div>
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-12 bg-zinc-700 rounded"></div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-400">Revenus totaux</p>
                <p className="text-2xl font-bold text-white">
                  {formatCurrency(salesStats.totalRevenue)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-400">Ventes totales</p>
                <p className="text-2xl font-bold text-white">{salesStats.totalSales}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-400">Revenus ce mois</p>
                <p className="text-2xl font-bold text-white">
                  {formatCurrency(salesStats.monthlyRevenue)}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-900 border-zinc-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-zinc-400">Produits actifs</p>
                <p className="text-2xl font-bold text-white">
                  {resources.filter(r => r.status === 'approved').length}
                </p>
              </div>
              <Package className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Liste des produits */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white">Mes Produits</CardTitle>
              <CardDescription>
                Gérez vos produits, modifiez leur statut et suivez leurs performances
              </CardDescription>
            </div>
            <Button
              onClick={() => router.push('/sell/new')}
              className="bg-[#FF7101] hover:bg-[#FF7101]/90 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nouveau produit
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {resources.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-zinc-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">
                Aucun produit
              </h3>
              <p className="text-zinc-400 mb-4">
                Vous n'avez pas encore créé de produit. Commencez dès maintenant !
              </p>
              <Button
                onClick={() => router.push('/sell/new')}
                className="bg-[#FF7101] hover:bg-[#FF7101]/90 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Créer mon premier produit
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-zinc-800">
                    <TableHead className="text-zinc-300">Produit</TableHead>
                    <TableHead className="text-zinc-300">Prix</TableHead>
                    <TableHead className="text-zinc-300">Statut</TableHead>
                    <TableHead className="text-zinc-300">Type</TableHead>
                    <TableHead className="text-zinc-300">Ventes</TableHead>
                    <TableHead className="text-zinc-300">Créé le</TableHead>
                    <TableHead className="text-zinc-300 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {resources.map((resource) => (
                    <TableRow key={resource.id} className="border-zinc-800">
                      <TableCell className="py-4">
                        <div className="flex items-center space-x-3">
                          {resource.thumbnail_url ? (
                            <Image
                              src={resource.thumbnail_url}
                              alt={resource.title}
                              width={48}
                              height={48}
                              className="rounded-md object-cover"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-zinc-700 rounded-md flex items-center justify-center">
                              <Package className="h-6 w-6 text-zinc-400" />
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-white">{resource.title}</p>
                            <p className="text-sm text-zinc-400 truncate max-w-xs">
                              {resource.description}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-white font-medium">
                        {formatCurrency(resource.price)}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(resource.status)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="border-zinc-600 text-zinc-300">
                          {resource.resource_type === 'escrow' ? 'Escrow' : 'Direct'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-white">
                        {resource.download_count || 0}
                      </TableCell>
                      <TableCell className="text-zinc-400">
                        {formatDate(resource.created_at)}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-zinc-400 hover:text-white"
                              disabled={updatingId === resource.id}
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent 
                            align="end" 
                            className="bg-zinc-800 border-zinc-700"
                          >
                            <DropdownMenuItem 
                              onClick={() => router.push(`/sell/edit/${resource.id}`)}
                              className="text-zinc-300 hover:text-white hover:bg-zinc-700"
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Modifier
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => toggleResourceStatus(resource.id, resource.status)}
                              className="text-zinc-300 hover:text-white hover:bg-zinc-700"
                            >
                              {resource.status === 'approved' ? (
                                <>
                                  <EyeOff className="h-4 w-4 mr-2" />
                                  Suspendre
                                </>
                              ) : (
                                <>
                                  <Eye className="h-4 w-4 mr-2" />
                                  Activer
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-zinc-700" />
                            <DropdownMenuItem 
                              onClick={() => deleteResource(resource.id, resource.title)}
                              className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Supprimer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Dialog de confirmation */}
      {dialogProps && <ConfirmationDialog {...dialogProps} />}
    </div>
  );
};

export default ResourceManagement;
