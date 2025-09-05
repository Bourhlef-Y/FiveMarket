"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/useToast';
import { 
  Package, 
  Download, 
  Search, 
  Calendar,
  DollarSign,
  User,
  Star,
  Eye
} from 'lucide-react';

interface Purchase {
  id: string;
  resource_id: string;
  resource_title: string;
  resource_description: string;
  resource_price: number;
  resource_category: string;
  resource_framework: string;
  author_username: string;
  author_avatar: string | null;
  total_price: number;
  status: string;
  created_at: string;
  download_url?: string;
}

export default function PurchasesPage() {
  const router = useRouter();
  const { user, profile, loading } = useAuth();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [filteredPurchases, setFilteredPurchases] = useState<Purchase[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingData, setLoadingData] = useState(true);
  const [stats, setStats] = useState({
    totalPurchases: 0,
    totalSpent: 0,
    recentPurchases: 0,
    recentSpent: 0,
    memberSince: '',
    categoryStats: [] as Array<{category: string, count: number, total: number}>
  });

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/sign-in');
      return;
    }

    if (user) {
      loadPurchases();
      loadStats();
    }
  }, [user, loading, router]);

  useEffect(() => {
    // Filtrer les achats selon le terme de recherche
    if (searchTerm) {
      const filtered = purchases.filter(purchase =>
        purchase.resource_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        purchase.author_username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        purchase.resource_category.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredPurchases(filtered);
    } else {
      setFilteredPurchases(purchases);
    }
  }, [searchTerm, purchases]);

  const loadPurchases = async () => {
    try {
      setLoadingData(true);
      
      const response = await fetch('/api/account/purchases');
      if (response.ok) {
        const data = await response.json();
        setPurchases(data.purchases || []);
        setFilteredPurchases(data.purchases || []);
      } else {
        console.error('Erreur API achats:', response.status, response.statusText);
        toast({
          title: 'Erreur',
          description: 'Impossible de charger vos achats',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Erreur lors du chargement des achats:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger vos achats',
        variant: 'destructive'
      });
    } finally {
      setLoadingData(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await fetch('/api/account/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      } else {
        console.error('Erreur API statistiques:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error);
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
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Terminé</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">En attente</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Annulé</Badge>;
      default:
        return <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30">{status}</Badge>;
    }
  };

  const handleDownload = async (purchase: Purchase) => {
    try {
      const response = await fetch(`/api/account/download/${purchase.id}`);
      if (response.ok) {
        const data = await response.json();
        window.open(data.downloadUrl, '_blank');
        toast({
          title: 'Téléchargement démarré',
          description: `Téléchargement de ${purchase.resource_title}`,
          variant: 'default'
        });
      } else {
        const errorData = await response.json();
        toast({
          title: 'Erreur',
          description: errorData.error || 'Impossible de télécharger la ressource',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Erreur lors du téléchargement:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de télécharger la ressource',
        variant: 'destructive'
      });
    }
  };

  const handleViewProduct = (resourceId: string) => {
    router.push(`/product/${resourceId}`);
  };

  if (loading || loadingData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#FF7101] mx-auto"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* En-tête */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Mes Achats</h1>
            <p className="text-gray-400 mt-2">
              Gérez et téléchargez vos ressources achetées
            </p>
          </div>
          <Button 
            onClick={() => router.push('/marketplace')}
            variant="outline"
            className="border-[#FF7101] text-[#FF7101] hover:bg-[#FF7101] hover:text-white"
          >
            <Package className="w-4 h-4 mr-2" />
            Voir le marketplace
          </Button>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="bg-zinc-800/50 border-zinc-700">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-blue-500/20 rounded-lg">
                <Package className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Total Achats</p>
                <p className="text-2xl font-bold text-white">{stats.totalPurchases}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-800/50 border-zinc-700">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-green-500/20 rounded-lg">
                <DollarSign className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Total Dépensé</p>
                <p className="text-2xl font-bold text-white">
                  {formatPrice(stats.totalSpent)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-800/50 border-zinc-700">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-purple-500/20 rounded-lg">
                <Download className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Ce Mois</p>
                <p className="text-2xl font-bold text-white">
                  {stats.recentPurchases} achats
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-800/50 border-zinc-700">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-orange-500/20 rounded-lg">
                <Calendar className="w-6 h-6 text-orange-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Dépensé ce Mois</p>
                <p className="text-2xl font-bold text-white">
                  {formatPrice(stats.recentSpent)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recherche */}
      <Card className="bg-zinc-800/50 border-zinc-700 mb-6">
        <CardContent className="p-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Rechercher dans vos achats..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-zinc-900/50 border-zinc-700"
            />
          </div>
        </CardContent>
      </Card>

      {/* Liste des achats */}
      <Card className="bg-zinc-800/50 border-zinc-700">
        <CardHeader>
          <CardTitle className="text-white">Historique des Achats</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredPurchases.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">
                {searchTerm ? 'Aucun achat trouvé' : 'Aucun achat pour le moment'}
              </h3>
              <p className="text-gray-400 mb-6">
                {searchTerm 
                  ? 'Essayez avec d\'autres mots-clés'
                  : 'Commencez par explorer notre marketplace et achetez votre première ressource'
                }
              </p>
              {!searchTerm && (
                <Button 
                  onClick={() => router.push('/marketplace')}
                  className="bg-[#FF7101] hover:bg-[#FF7101]/90 text-white"
                >
                  <Package className="w-4 h-4 mr-2" />
                  Explorer le marketplace
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredPurchases.map((purchase) => (
                <div key={purchase.id} className="p-6 bg-zinc-900/50 rounded-lg border border-zinc-700 hover:bg-zinc-900/70 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <h3 className="text-xl font-semibold text-white">{purchase.resource_title}</h3>
                        {getStatusBadge(purchase.status)}
                      </div>
                      
                      <p className="text-gray-400 mb-4 line-clamp-2">{purchase.resource_description}</p>
                      
                      <div className="flex items-center space-x-6 text-sm text-gray-400 mb-4">
                        <div className="flex items-center space-x-2">
                          <User className="w-4 h-4" />
                          <span>Par {purchase.author_username}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Package className="w-4 h-4" />
                          <span>{purchase.resource_category}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span>Framework: {purchase.resource_framework}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4" />
                          <span>Acheté le {formatDate(purchase.created_at)}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        <span className="text-lg font-semibold text-green-400">
                          {formatPrice(purchase.total_price)}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-6">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewProduct(purchase.resource_id)}
                        className="border-zinc-600 text-zinc-300 hover:bg-zinc-700"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Voir
                      </Button>
                      
                      {purchase.download_url && (
                        <Button
                          size="sm"
                          onClick={() => handleDownload(purchase)}
                          className="bg-[#FF7101] hover:bg-[#FF7101]/90 text-white"
                        >
                          <Download className="w-4 h-4 mr-1" />
                          Télécharger
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}