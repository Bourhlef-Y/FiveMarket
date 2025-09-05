"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import SellerRequestsTable, { SellerRequest } from '@/components/admin/SellerRequestsTable';
import { toast } from '@/hooks/useToast';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function AdminSellersPage() {
  const [requests, setRequests] = useState<SellerRequest[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
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

  const loadSellerRequests = async (page: number, search: string = '') => {
    try {
      console.log('Chargement des demandes de vendeurs:', { page, search });
      setLoading(true);

      // Vérifier l'authentification et les autorisations avant la requête
      if (!user) {
        throw new Error('Utilisateur non authentifié');
      }

  
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        throw new Error('Impossible de récupérer le token d\'authentification');
      }

      const response = await fetch(
        `/api/admin/sellers?page=${page}&search=${encodeURIComponent(search)}`,
        { 
          credentials: 'include',
          headers: {
            'Authorization': `Bearer ${token}` // Utiliser le token de session
          }
        }
      );

      console.log('Réponse de la requête:', response.status, response.statusText);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Erreur de la requête:', errorData);
        throw new Error(errorData.error || errorData.details || 'Erreur lors du chargement des demandes de vendeurs');
      }

      const data = await response.json();
      console.log('Données reçues:', data);

      setRequests(data.requests || []);
      setTotalCount(data.totalCount || 0);
    } catch (error) {
      console.error('Erreur complète lors du chargement des demandes de vendeurs:', error);
      toast({
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Une erreur inattendue est survenue',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (profile?.role === 'admin') {
      loadSellerRequests(currentPage, searchTerm);
    }
  }, [currentPage, profile]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    setCurrentPage(1);
    loadSellerRequests(1, term);
  };

  if (!profile || profile.role !== 'admin') {
    return null; // Ou un composant de chargement/redirection
  }

  return (
    <Card className="bg-zinc-800/50 border-zinc-700">
      <CardContent className="pt-6">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#FF7101]"></div>
          </div>
        ) : (
          <SellerRequestsTable
            requests={requests}
            totalCount={totalCount}
            currentPage={currentPage}
            onPageChange={handlePageChange}
            onSearch={handleSearch}
            pageSize={pageSize}
          />
        )}
      </CardContent>
    </Card>
  );
}
