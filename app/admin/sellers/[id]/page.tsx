"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/useToast";
import { ArrowLeft, User, Mail, Building, Calendar, FileText } from 'lucide-react';

interface SellerRequestDetail {
  id: string;
  user_id: string;
  username: string;
  avatar: string | null;
  email: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
  business_name: string;
  business_type: string;
  motivation: string;
  user_created_at: string | null;
}

export default function SellerRequestDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [request, setRequest] = useState<SellerRequestDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const requestId = params.id as string;

  useEffect(() => {
    if (requestId) {
      loadRequest();
    }
  }, [requestId]);

  const loadRequest = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/sellers/${requestId}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          toast({
            title: 'Erreur',
            description: 'Demande de vendeur non trouvée',
            variant: 'destructive',
          });
          router.push('/admin/sellers');
          return;
        }
        throw new Error('Erreur lors du chargement de la demande');
      }

      const data = await response.json();
      setRequest(data);
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

  const handleStatusChange = async (newStatus: 'approved' | 'rejected') => {
    try {
      setUpdating(true);
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

      // Recharger les données
      await loadRequest();
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">En attente</Badge>;
      case 'approved':
        return <Badge variant="default">Approuvé</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejeté</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center space-x-4 mb-6">
          <Button
            variant="outline"
            onClick={() => router.push('/admin/sellers')}
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

  if (!request) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center space-x-4 mb-6">
          <Button
            variant="outline"
            onClick={() => router.push('/admin/sellers')}
            className="border-[#FF7101] text-[#FF7101] hover:bg-[#FF7101] hover:text-white"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
          <h1 className="text-2xl font-bold">Demande non trouvée</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center space-x-4 mb-6">
        <Button
          variant="outline"
          onClick={() => router.push('/admin/sellers')}
          className="border-[#FF7101] text-[#FF7101] hover:bg-[#FF7101] hover:text-white"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour
        </Button>
        <h1 className="text-2xl font-bold">Détails de la demande de vendeur</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Informations principales */}
        <div className="lg:col-span-2 space-y-6">
          {/* Informations utilisateur */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="w-5 h-5" />
                <span>Informations utilisateur</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-4">
                <Avatar className="w-16 h-16">
                  <AvatarImage src={request.avatar || undefined} alt={request.username} />
                  <AvatarFallback className="text-lg">
                    {request.username.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-semibold">{request.username}</h3>
                  <p className="text-gray-500">{request.email}</p>
                  {request.user_created_at && (
                    <p className="text-sm text-gray-400">
                      Membre depuis {formatDate(request.user_created_at)}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Informations entreprise */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Building className="w-5 h-5" />
                <span>Informations entreprise</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Nom de l'entreprise</label>
                <p className="text-lg">{request.business_name}</p>
              </div>
              <Separator />
              <div>
                <label className="text-sm font-medium text-gray-500">Type d'entreprise</label>
                <p className="text-lg">{request.business_type}</p>
              </div>
            </CardContent>
          </Card>

          {/* Motivation */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="w-5 h-5" />
                <span>Motivation</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 whitespace-pre-wrap">{request.motivation}</p>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Statut et actions */}
          <Card>
            <CardHeader>
              <CardTitle>Statut de la demande</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Statut actuel</span>
                {getStatusBadge(request.status)}
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <Calendar className="w-4 h-4" />
                  <span>Créée le {formatDate(request.created_at)}</span>
                </div>
                {request.updated_at !== request.created_at && (
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <Calendar className="w-4 h-4" />
                    <span>Modifiée le {formatDate(request.updated_at)}</span>
                  </div>
                )}
              </div>

              {request.status === 'pending' && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <Button
                      className="w-full bg-green-600 hover:bg-green-700"
                      onClick={() => handleStatusChange('approved')}
                      disabled={updating}
                    >
                      {updating ? 'Mise à jour...' : 'Approuver'}
                    </Button>
                    <Button
                      variant="destructive"
                      className="w-full"
                      onClick={() => handleStatusChange('rejected')}
                      disabled={updating}
                    >
                      {updating ? 'Mise à jour...' : 'Rejeter'}
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Informations techniques */}
          <Card>
            <CardHeader>
              <CardTitle>Informations techniques</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">ID de la demande</span>
                <span className="font-mono text-xs">{request.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">ID utilisateur</span>
                <span className="font-mono text-xs">{request.user_id}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
