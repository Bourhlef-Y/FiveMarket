"use client";

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { toast } from "@/hooks/useToast";
import { supabase } from '@/lib/supabaseClient';
import AvatarUpload from '@/components/AvatarUpload';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { 
  User, 
  Shield, 
  Settings, 
  ShoppingBag, 
  Package, 
  TrendingUp,
  Bell,
  CreditCard,
  HelpCircle,
  LogOut,
  Trash2
} from 'lucide-react';

interface ExtendedProfile {
  id: string;
  username: string | null;
  avatar: string | null;
  role: 'buyer' | 'seller' | 'admin';
  description?: string | null;
  birth_date?: string | null;
  country?: string | null;
  auth_email?: string;
  created_at?: string;
}

export default function AccountPage() {
  const router = useRouter();
  const { user, profile, loading, signOut } = useAuth();
  
  // États pour la gestion du profil
  const [username, setUsername] = useState('');
  const [description, setDescription] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [country, setCountry] = useState('');

  // États pour la sécurité
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // États pour les statistiques
  const [stats, setStats] = useState({
    totalPurchases: 0,
    totalSpent: 0,
    memberSince: '',
    lastLogin: ''
  });

  useEffect(() => {
    const extendedProfile = profile as ExtendedProfile | null;
    if (extendedProfile) {
      setUsername(extendedProfile.username || '');
      setDescription(extendedProfile.description || '');
      setBirthDate(extendedProfile.birth_date || '');
      setCountry(extendedProfile.country || '');
      
      // Calculer les statistiques
      if (extendedProfile.created_at) {
        const memberSince = new Date(extendedProfile.created_at).toLocaleDateString('fr-FR', {
          year: 'numeric',
          month: 'long'
        });
        setStats(prev => ({ ...prev, memberSince }));
      }
    }
  }, [profile]);

  const handleUpdateProfile = async () => {
    if (!user) return;

    try {
  
      const { error } = await supabase
        .from('profiles')
        .update({
          username,
          description,
          birth_date: birthDate || null,
          country: country || null
        })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: 'Profil mis à jour',
        description: 'Vos informations ont été sauvegardées avec succès',
        variant: 'default'
      });
    } catch (error) {
      console.error('Erreur lors de la mise à jour du profil:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de mettre à jour votre profil',
        variant: 'destructive'
      });
    }
  };

  const handleUpdatePassword = async () => {
    if (!currentPassword || !newPassword || newPassword !== confirmPassword) {
      toast({
        title: 'Erreur',
        description: 'Veuillez vérifier vos mots de passe',
        variant: 'destructive'
      });
      return;
    }

    try {
  
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      toast({
        title: 'Mot de passe mis à jour',
        description: 'Votre mot de passe a été changé avec succès',
        variant: 'default'
      });

      // Réinitialiser les champs
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      console.error('Erreur lors de la mise à jour du mot de passe:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de mettre à jour le mot de passe',
        variant: 'destructive'
      });
    }
  };

  const handleDeleteAccount = async () => {
    try {
  
      const { error } = await supabase.auth.signOut();

      if (error) throw error;

      toast({
        title: 'Compte supprimé',
        description: 'Votre compte a été supprimé avec succès',
        variant: 'default'
      });

      await signOut();
      router.push('/');
    } catch (error) {
      console.error('Erreur lors de la suppression du compte:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer votre compte',
        variant: 'destructive'
      });
    }
  };

  const handleAvatarUpload = async (avatarUrl: string) => {
    if (!user) return;

    try {
  
      const { error } = await supabase
        .from('profiles')
        .update({ avatar: avatarUrl })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: 'Avatar mis à jour',
        description: 'Votre photo de profil a été mise à jour avec succès',
        variant: 'default'
      });
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'avatar:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de mettre à jour votre avatar',
        variant: 'destructive'
      });
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#FF7101] mx-auto"></div>
      </div>
    );
  }

  if (!user) {
    router.push('/auth/sign-in');
    return null;
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Administrateur</Badge>;
      case 'seller':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Vendeur</Badge>;
      default:
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Acheteur</Badge>;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* En-tête avec informations utilisateur */}
      <div className="mb-8">
        <div className="flex items-center space-x-4 mb-4">
          <div className="relative">
            <AvatarUpload 
              avatar={profile?.avatar || null} 
              onUpload={handleAvatarUpload}
              email={user.email || ''}
            />
            {getRoleBadge(profile?.role || 'buyer')}
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">
              {profile?.username || 'Utilisateur'}
            </h1>
            <p className="text-gray-400">{user.email}</p>
            <p className="text-sm text-gray-500">
              Membre depuis {stats.memberSince}
            </p>
          </div>
        </div>
      </div>

      {/* Actions rapides */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="bg-zinc-800/50 border-zinc-700 hover:bg-zinc-800/70 transition-colors cursor-pointer" onClick={() => router.push('/cart')}>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <ShoppingBag className="w-8 h-8 text-[#FF7101]" />
              <div>
                <p className="text-sm text-gray-400">Panier</p>
                <p className="text-lg font-semibold text-white">Mes achats</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-zinc-800/50 border-zinc-700 hover:bg-zinc-800/70 transition-colors cursor-pointer" onClick={() => router.push('/account/purchases')}>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <Package className="w-8 h-8 text-green-500" />
              <div>
                <p className="text-sm text-gray-400">Commandes</p>
                <p className="text-lg font-semibold text-white">Mes achats</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {profile?.role === 'seller' && (
          <Card className="bg-zinc-800/50 border-zinc-700 hover:bg-zinc-800/70 transition-colors cursor-pointer" onClick={() => router.push('/seller')}>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <TrendingUp className="w-8 h-8 text-blue-500" />
                <div>
                  <p className="text-sm text-gray-400">Vendeur</p>
                  <p className="text-lg font-semibold text-white">Tableau de bord</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="bg-zinc-800/50 border-zinc-700 hover:bg-zinc-800/70 transition-colors cursor-pointer" onClick={() => router.push('/support')}>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <HelpCircle className="w-8 h-8 text-purple-500" />
              <div>
                <p className="text-sm text-gray-400">Support</p>
                <p className="text-lg font-semibold text-white">Aide</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Onglets principaux */}
      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 bg-zinc-800/50">
          <TabsTrigger value="profile" className="flex items-center space-x-2">
            <User className="w-4 h-4" />
            <span>Profil</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center space-x-2">
            <Shield className="w-4 h-4" />
            <span>Sécurité</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center space-x-2">
            <Bell className="w-4 h-4" />
            <span>Notifications</span>
          </TabsTrigger>
          <TabsTrigger value="danger" className="flex items-center space-x-2">
            <Settings className="w-4 h-4" />
            <span>Paramètres</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card className="bg-zinc-800/50 border-zinc-700">
            <CardHeader>
              <CardTitle className="text-xl text-white flex items-center space-x-2">
                <User className="w-5 h-5" />
                <span>Informations du Profil</span>
              </CardTitle>
              <CardDescription>Gérez vos informations personnelles</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">Nom d'utilisateur</label>
                  <Input 
                    value={username} 
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Votre nom d'utilisateur"
                    className="bg-zinc-900/50 border-zinc-700"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">Date de naissance</label>
                  <Input 
                    type="date" 
                    value={birthDate} 
                    onChange={(e) => setBirthDate(e.target.value)}
                    className="bg-zinc-900/50 border-zinc-700"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">Pays</label>
                  <Select value={country} onValueChange={setCountry}>
                    <SelectTrigger className="bg-zinc-900/50 border-zinc-700">
                      <SelectValue placeholder="Sélectionnez votre pays" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FR">🇫🇷 France</SelectItem>
                      <SelectItem value="BE">🇧🇪 Belgique</SelectItem>
                      <SelectItem value="CH">🇨🇭 Suisse</SelectItem>
                      <SelectItem value="CA">🇨🇦 Canada</SelectItem>
                      <SelectItem value="US">🇺🇸 États-Unis</SelectItem>
                      <SelectItem value="OTHER">🌍 Autre</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">Email</label>
                  <Input 
                    value={user.email || ''} 
                    readOnly 
                    className="cursor-not-allowed opacity-60 bg-zinc-900/50 border-zinc-700" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Description</label>
                <Textarea 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Parlez-nous un peu de vous..."
                  maxLength={500}
                  className="bg-zinc-900/50 border-zinc-700"
                />
                <p className="text-xs text-zinc-500 mt-1">{description.length}/500 caractères</p>
              </div>

              <Button 
                onClick={handleUpdateProfile}
                className="w-full bg-[#FF7101] hover:bg-[#FF7101]/90 text-white"
              >
                Mettre à jour le profil
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card className="bg-zinc-800/50 border-zinc-700">
            <CardHeader>
              <CardTitle className="text-xl text-white flex items-center space-x-2">
                <Shield className="w-5 h-5" />
                <span>Sécurité du Compte</span>
              </CardTitle>
              <CardDescription>Gérez vos paramètres de sécurité</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Mot de passe actuel</label>
                <Input 
                  type="password" 
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Votre mot de passe actuel"
                  className="bg-zinc-900/50 border-zinc-700"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Nouveau mot de passe</label>
                <Input 
                  type="password" 
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Nouveau mot de passe"
                  className="bg-zinc-900/50 border-zinc-700"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">Confirmer le nouveau mot de passe</label>
                <Input 
                  type="password" 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirmez le nouveau mot de passe"
                  className="bg-zinc-900/50 border-zinc-700"
                />
              </div>

              <Button 
                onClick={handleUpdatePassword}
                className="w-full bg-[#FF7101] hover:bg-[#FF7101]/90 text-white"
              >
                Changer le mot de passe
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card className="bg-zinc-800/50 border-zinc-700">
            <CardHeader>
              <CardTitle className="text-xl text-white flex items-center space-x-2">
                <Bell className="w-5 h-5" />
                <span>Notifications</span>
              </CardTitle>
              <CardDescription>Gérez vos préférences de notification</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center py-8">
                <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-400">Les paramètres de notification seront bientôt disponibles</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="danger">
          <Card className="bg-zinc-800/50 border-zinc-700">
            <CardHeader>
              <CardTitle className="text-xl text-white flex items-center space-x-2">
                <Settings className="w-5 h-5" />
                <span>Paramètres du Compte</span>
              </CardTitle>
              <CardDescription>Actions avancées et paramètres du compte</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <Button 
                  variant="outline" 
                  onClick={handleSignOut}
                  className="w-full border-zinc-600 text-zinc-300 hover:bg-zinc-700"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Se déconnecter
                </Button>

                <div className="border-t border-zinc-700 pt-6">
                  <h3 className="text-lg font-semibold text-red-500 mb-4 flex items-center space-x-2">
                    <Trash2 className="w-5 h-5" />
                    <span>Zone de danger</span>
                  </h3>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" className="w-full">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Supprimer mon compte
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Êtes-vous sûr de vouloir supprimer votre compte ?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Cette action est irréversible. Toutes vos données seront définitivement supprimées.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteAccount}>
                          Supprimer définitivement
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}