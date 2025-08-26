"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/lib/supabaseClient";

interface User {
  id: string;
  username: string | null;
  avatar_url: string | null;
  role: 'buyer' | 'seller' | 'admin';
  created_at: string;
  auth_email: string | null;
  discord_username: string | null;
  country: string | null;
  description: string | null;
}

interface Resource {
  id: string;
  title: string;
  price: number;
  status: string;
  created_at: string;
}

interface Order {
  id: string;
  resource_id: string;
  created_at: string;
  resource: {
    title: string;
    price: number;
  };
}

export default function UserDetailsPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [resources, setResources] = useState<Resource[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string>('');

  useEffect(() => {
    fetchUserData();
  }, [params.id]);

  const fetchUserData = async () => {
    try {
      setLoading(true);

      // Récupérer les informations de l'utilisateur
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', params.id)
        .single();

      if (userError) throw userError;
      setUser(userData);

      // Si l'utilisateur est un vendeur, récupérer ses ressources
      if (userData.role === 'seller') {
        const { data: resourcesData, error: resourcesError } = await supabase
          .from('resources')
          .select('id, title, price, status, created_at')
          .eq('author_id', params.id)
          .order('created_at', { ascending: false });

        if (resourcesError) throw resourcesError;
        setResources(resourcesData);
      }

      // Récupérer les commandes de l'utilisateur
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select(`
          id,
          resource_id,
          created_at,
          resource:resource_id (
            title,
            price
          )
        `)
        .eq('buyer_id', params.id)
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;
      setOrders(ordersData);

    } catch (error: any) {
      console.error('Erreur lors du chargement des données:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async () => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: selectedRole })
        .eq('id', params.id);

      if (error) throw error;

      setUser(prev => prev ? { ...prev, role: selectedRole as User['role'] } : null);
      toast.success('Rôle mis à jour avec succès');
      setShowRoleDialog(false);
    } catch (error: any) {
      console.error('Erreur lors de la mise à jour du rôle:', error);
      toast.error('Erreur lors de la mise à jour du rôle');
    }
  };

  const handleDeleteUser = async () => {
    try {
      // Supprimer le profil
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', params.id);

      if (profileError) throw profileError;

      toast.success('Utilisateur supprimé avec succès');
      router.push('/admin/users');
    } catch (error: any) {
      console.error('Erreur lors de la suppression:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <Badge className="bg-red-500">Admin</Badge>;
      case 'seller':
        return <Badge className="bg-[#FF7101]">Vendeur</Badge>;
      default:
        return <Badge className="bg-zinc-500">Utilisateur</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-[#FF7101]"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-zinc-900 flex items-center justify-center">
        <div className="text-white">Utilisateur non trouvé</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* En-tête */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => router.push('/admin/users')}
            className="border-zinc-700 text-zinc-400"
          >
            Retour à la liste
          </Button>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setSelectedRole(user.role);
                setShowRoleDialog(true);
              }}
              className="border-zinc-700 text-zinc-400"
            >
              Changer le rôle
            </Button>
            <Button
              variant="destructive"
              onClick={() => setShowDeleteDialog(true)}
            >
              Supprimer
            </Button>
          </div>
        </div>

        {/* Informations de l'utilisateur */}
        <Card className="bg-zinc-800/50 border-zinc-700">
          <CardHeader>
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={user.avatar_url || undefined} />
                <AvatarFallback className="text-2xl">
                  {user.username?.[0]?.toUpperCase() || '?'}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-2xl text-white">
                  {user.username || 'Sans nom'}
                </CardTitle>
                <CardDescription className="flex items-center gap-2">
                  {user.auth_email}
                  {getRoleBadge(user.role)}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium text-zinc-400">Discord</h4>
                <p className="text-white">{user.discord_username || '-'}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-zinc-400">Pays</h4>
                <p className="text-white">{user.country || '-'}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-zinc-400">Membre depuis</h4>
                <p className="text-white">
                  {new Date(user.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
            {user.description && (
              <div>
                <h4 className="text-sm font-medium text-zinc-400 mb-2">Description</h4>
                <p className="text-white">{user.description}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Ressources (si vendeur) */}
        {user.role === 'seller' && (
          <Card className="bg-zinc-800/50 border-zinc-700">
            <CardHeader>
              <CardTitle className="text-white">Ressources publiées</CardTitle>
              <CardDescription>
                Liste des ressources publiées par ce vendeur
              </CardDescription>
            </CardHeader>
            <CardContent>
              {resources.length > 0 ? (
                <div className="space-y-4">
                  {resources.map((resource) => (
                    <div
                      key={resource.id}
                      className="flex items-center justify-between p-4 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition-colors cursor-pointer"
                      onClick={() => router.push(`/product/${resource.id}`)}
                    >
                      <div>
                        <h4 className="text-white font-medium">{resource.title}</h4>
                        <p className="text-sm text-zinc-400">
                          {new Date(resource.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge
                          className={
                            resource.status === 'approved'
                              ? 'bg-green-500'
                              : resource.status === 'pending'
                              ? 'bg-yellow-500'
                              : resource.status === 'rejected'
                              ? 'bg-red-500'
                              : 'bg-zinc-500'
                          }
                        >
                          {resource.status}
                        </Badge>
                        <span className="text-white font-medium">
                          {resource.price.toFixed(2)} €
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-zinc-400">Aucune ressource publiée</p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Commandes */}
        <Card className="bg-zinc-800/50 border-zinc-700">
          <CardHeader>
            <CardTitle className="text-white">Historique des achats</CardTitle>
            <CardDescription>
              Liste des ressources achetées par cet utilisateur
            </CardDescription>
          </CardHeader>
          <CardContent>
            {orders.length > 0 ? (
              <div className="space-y-4">
                {orders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition-colors cursor-pointer"
                    onClick={() => router.push(`/product/${order.resource_id}`)}
                  >
                    <div>
                      <h4 className="text-white font-medium">
                        {order.resource.title}
                      </h4>
                      <p className="text-sm text-zinc-400">
                        {new Date(order.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="text-white font-medium">
                      {order.resource.price.toFixed(2)} €
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-zinc-400">Aucun achat effectué</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialog de changement de rôle */}
      <AlertDialog open={showRoleDialog} onOpenChange={setShowRoleDialog}>
        <AlertDialogContent className="bg-zinc-900 border-zinc-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">
              Changer le rôle
            </AlertDialogTitle>
            <AlertDialogDescription>
              Sélectionnez le nouveau rôle pour cet utilisateur
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                <SelectValue placeholder="Sélectionnez un rôle" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-800 border-zinc-700">
                <SelectItem value="buyer">Utilisateur</SelectItem>
                <SelectItem value="seller">Vendeur</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-zinc-800 text-white border-zinc-700">
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRoleChange}
              className="bg-[#FF7101] text-white hover:bg-[#FF7101]/90"
            >
              Confirmer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog de suppression */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="bg-zinc-900 border-zinc-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">
              Supprimer l'utilisateur
            </AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Toutes les données de l'utilisateur seront supprimées.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-zinc-800 text-white border-zinc-700">
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              Supprimer définitivement
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
