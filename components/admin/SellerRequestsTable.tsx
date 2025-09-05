"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "@/hooks/useToast";
import { Eye, Check, X } from 'lucide-react';

export interface SellerRequest {
  id: string;
  user_id: string;
  username: string | null;
  avatar: string | null;
  email: string | null;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
  reason?: string | null; // JSON string contenant les détails de la demande
}

interface SellerRequestDetails {
  business_name?: string;
  business_type?: string;
  motivation?: string;
}

interface SellerRequestsTableProps {
  requests: SellerRequest[];
  totalCount: number;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onSearch: (term: string) => void;
}

export default function SellerRequestsTable({
  requests,
  totalCount,
  currentPage,
  pageSize,
  onPageChange,
  onSearch
}: SellerRequestsTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();

  const parseReason = (reason?: string | null): SellerRequestDetails => {
    try {
      return reason ? JSON.parse(reason) : {};
    } catch {
      console.error('Erreur de parsing du champ reason');
      return {};
    }
  };

  const handleStatusChange = async (requestId: string, newStatus: 'approved' | 'rejected') => {
    try {
      const response = await fetch(`/api/admin/sellers/${requestId}`, {
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

      toast({
        title: 'Succès',
        description: `Demande de vendeur ${newStatus === 'approved' ? 'approuvée' : 'rejetée'}`,
        variant: 'default',
      });

      // Trigger a refresh of the requests
      onSearch(searchTerm);
    } catch (error) {
      console.error('Erreur:', error);
      toast({
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Une erreur est survenue',
        variant: 'destructive',
      });
    }
  };

  const handleViewDetails = (requestId: string) => {
    router.push(`/admin/sellers/${requestId}`);
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div className="flex space-x-2">
          <Input 
            id="seller-requests-search"
            name="seller-requests-search"
            placeholder="Rechercher..." 
            value={searchTerm}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
            className="w-64"
            aria-label="Rechercher des demandes de vendeurs"
          />
          <Button 
            variant="outline" 
            onClick={() => onSearch(searchTerm)}
            className="border-[#FF7101] text-[#FF7101] hover:bg-[#FF7101] hover:text-white"
          >
            Rechercher
          </Button>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Utilisateur</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Nom de l'entreprise</TableHead>
            <TableHead>Type d'entreprise</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {requests.map((request) => {
            const details = parseReason(request.reason);
            return (
              <TableRow key={request.id}>
                <TableCell>
                  <div className="flex items-center space-x-3">
                    <Avatar>
                      <AvatarImage src={request.avatar || undefined} alt={request.username || ''} />
                      <AvatarFallback>{request.username?.charAt(0).toUpperCase() || 'U'}</AvatarFallback>
                    </Avatar>
                    <span>{request.username}</span>
                  </div>
                </TableCell>
                <TableCell>{request.email}</TableCell>
                <TableCell>{details.business_name || 'Non spécifié'}</TableCell>
                <TableCell>{details.business_type || 'Non spécifié'}</TableCell>
                <TableCell>
                  <Badge 
                    variant={
                      request.status === 'pending' ? 'secondary' : 
                      request.status === 'approved' ? 'default' : 'destructive'
                    }
                  >
                    {request.status === 'pending' ? 'En attente' : 
                     request.status === 'approved' ? 'Approuvé' : 'Rejeté'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="border-[#FF7101] text-[#FF7101] hover:bg-[#FF7101] hover:text-white"
                      onClick={() => handleViewDetails(request.id)}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Voir
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {/* Pagination */}
      <div className="flex justify-between items-center mt-4">
        <div className="text-sm text-zinc-400">
          Page {currentPage} sur {totalPages} - Total : {totalCount} demandes
        </div>
        <div className="flex space-x-2">
          <Button 
            variant="outline" 
            disabled={currentPage === 1}
            onClick={() => onPageChange(currentPage - 1)}
            className="border-[#FF7101] text-[#FF7101] hover:bg-[#FF7101] hover:text-white"
          >
            Précédent
          </Button>
          <Button 
            variant="outline" 
            disabled={currentPage === totalPages}
            onClick={() => onPageChange(currentPage + 1)}
            className="border-[#FF7101] text-[#FF7101] hover:bg-[#FF7101] hover:text-white"
          >
            Suivant
          </Button>
        </div>
      </div>
    </div>
  );
}
