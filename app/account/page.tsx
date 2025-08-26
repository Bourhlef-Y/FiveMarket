"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Package, Edit, Trash2, Eye } from "lucide-react";
import { RoleGuard } from "@/components/RoleGuard";

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useSecurityActions } from "@/lib/accountUtils";
import { useAuthMethod } from "@/hooks/useAuthMethod";
import { toast } from "@/hooks/useToast";
import { useConfirmationDialog } from "@/components/ConfirmationDialog";
import { useAuth } from '@/contexts/AuthContext';
import { createClient } from '@/lib/supabase-browser';
import { useRouter } from 'next/navigation';
import AvatarUpload from '@/components/AvatarUpload';
import ResourceManagement from '@/components/ResourceManagement';
import DeleteAccountDialog from '@/components/DeleteAccountDialog';

interface Profile {
  id: string;
  username: string | null;
  avatar: string | null;
  description: string | null;
  birth_date: string | null;
  country: string | null;
  role: 'buyer' | 'seller' | 'admin';
}

interface UserResource {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  status: 'draft' | 'pending' | 'approved' | 'rejected' | 'suspended';
  created_at: string;
}

export default function AccountPage() {
  const { user, profile: authProfile, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [username, setUsername] = useState('');
  const [description, setDescription] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [country, setCountry] = useState('');
  
  // États pour la sécurité
  const [currentPassword, setCurrentPassword] = useState('');
  const [securityPassword, setSecurityPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [passwordStrength, setPasswordStrength] = useState<{
    score: number;
    level?: { label: string; color: string; bg: string };
    feedback: string;
    isValid?: boolean;
  }>({ score: 0, feedback: '' });
  
  // États pour les dialogues de confirmation
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  
  // Actions de sécurité
  const securityActions = useSecurityActions();
  const authMethod = useAuthMethod();
  // Fonctions d'alerte simplifiées
  const showSuccess = (title: string, description?: string) => {
    toast({
      title,
      description,
      variant: 'success',
    });
  };

  const showError = (title: string, description?: string) => {
    toast({
      title,
      description,
      variant: 'destructive',
    });
  };

  const showWarning = (title: string, description?: string) => {
    toast({
      title,
      description,
      variant: 'warning',
    });
  };
  const { showConfirmation, ConfirmationDialogComponent } = useConfirmationDialog();
  const [userResources, setUserResources] = useState<UserResource[]>([]);
  const [activeTab, setActiveTab] = useState('profile');
  const router = useRouter();

  useEffect(() => {
    // Redirection si pas d'utilisateur
    if (!authLoading && !user) {
      console.log('🔍 Aucune session détectée, redirection vers sign-in');
      router.push('/auth/sign-in');
      return;
    }

    // Initialiser le profil depuis l'AuthContext
    if (authProfile) {
      console.log('✅ Profil chargé depuis AuthContext:', authProfile.username);
      // Adapter le profil de l'AuthContext au format local
      setProfile({
        id: authProfile.id,
        username: authProfile.username,
        avatar: authProfile.avatar,
        description: null, // Sera chargé depuis la BDD si besoin
        birth_date: null,
        country: null,
        role: authProfile.role
      });
      setUsername(authProfile.username || '');
      // Les autres champs seront chargés depuis la BDD
    }

    // Gérer l'onglet basé sur le hash de l'URL
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.substring(1);
      if (hash === 'resources') {
        setActiveTab('resources');
      }
    }
  }, [user, authProfile, authLoading, router]);

  // Fonctions de sécurité
  const checkPasswordStrength = (password: string) => {
    let score = 0;
    let feedback = [];

    // Longueur minimale
    if (password.length >= 8) score += 1;
    else feedback.push('Au moins 8 caractères');

    // Majuscule
    if (/[A-Z]/.test(password)) score += 1;
    else feedback.push('Une majuscule');

    // Minuscule
    if (/[a-z]/.test(password)) score += 1;
    else feedback.push('Une minuscule');

    // Chiffre
    if (/\d/.test(password)) score += 1;
    else feedback.push('Un chiffre');

    // Caractère spécial
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 1;
    else feedback.push('Un caractère spécial');

    const strengthLevels: { [key: number]: { label: string; color: string; bg: string } } = {
      0: { label: 'Très faible', color: 'text-red-500', bg: 'bg-red-500' },
      1: { label: 'Faible', color: 'text-red-400', bg: 'bg-red-400' },
      2: { label: 'Moyen', color: 'text-yellow-500', bg: 'bg-yellow-500' },
      3: { label: 'Bon', color: 'text-blue-500', bg: 'bg-blue-500' },
      4: { label: 'Fort', color: 'text-green-500', bg: 'bg-green-500' },
      5: { label: 'Très fort', color: 'text-green-400', bg: 'bg-green-400' }
    };

    return {
      score,
      level: strengthLevels[score] || strengthLevels[0],
      feedback: feedback.length > 0 ? `Manque: ${feedback.join(', ')}` : 'Mot de passe sécurisé',
      isValid: score >= 3 // Minimum "Bon"
    };
  };

  const handlePasswordChange = (newPassword: string) => {
    setSecurityPassword(newPassword);
    setPasswordStrength(checkPasswordStrength(newPassword));
  };

  // Note: Pour une vérification sécurisée du mot de passe actuel,
  // nous allons déléguer cette responsabilité au backend Supabase
  // qui vérifie automatiquement l'authentification avant de permettre les mises à jour

  const handleUpdatePassword = async () => {
    // Vérifications côté client
    if (!currentPassword.trim()) {
      showWarning('Veuillez saisir votre mot de passe actuel');
      return;
    }

    if (!securityPassword.trim()) {
      showWarning('Veuillez saisir un nouveau mot de passe');
      return;
    }

    // Vérification de la force du mot de passe
    const strength = checkPasswordStrength(securityPassword);
    if (!strength.isValid) {
      showError('Mot de passe trop faible', strength.feedback);
      return;
    }

    // Vérification de la confirmation
    if (securityPassword !== confirmPassword) {
      showWarning('Les mots de passe ne correspondent pas');
      return;
    }

    // Tentative de mise à jour avec le nouveau mot de passe et vérification de l'actuel
    const result = await securityActions.updatePassword(securityPassword, currentPassword);
    
    if (result.success) {
      showSuccess('Mot de passe mis à jour avec succès', 'Votre mot de passe a été modifié et est maintenant actif.');
      setCurrentPassword('');
      setSecurityPassword('');
      setConfirmPassword('');
      setPasswordStrength({ score: 0, feedback: '' });
      setShowPasswordDialog(false);
    } else {
      // Si l'erreur concerne l'authentification, c'est probablement que le mot de passe actuel est incorrect
      if (result.message.includes('auth') || result.message.includes('session')) {
        showWarning('Session expirée', 'Veuillez vous reconnecter pour des raisons de sécurité');
      } else {
        showError('Erreur lors de la mise à jour', result.message);
      }
    }
  };

  const handleLogout = async () => {
    const confirmed = await showConfirmation({
      title: 'Confirmer la déconnexion',
      description: 'Êtes-vous sûr de vouloir vous déconnecter ?',
      confirmText: 'Se déconnecter',
      cancelText: 'Annuler',
      variant: 'default',
      icon: 'info',
      onConfirm: async () => {
        const result = await securityActions.signOut();
        
        if (result.success) {
          showSuccess('Déconnexion réussie', 'Vous avez été déconnecté avec succès');
          router.push('/');
        } else {
          showError('Erreur lors de la déconnexion', result.message);
        }
      }
    });
  };

  const handleSendPasswordResetEmail = async () => {
    const result = await securityActions.sendPasswordResetEmail();
    
    if (result.success) {
      showSuccess('Email envoyé', result.message);
    } else {
      showError('Erreur lors de l\'envoi', result.message);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmed = await showConfirmation({
      title: 'Supprimer définitivement le compte',
      description: 'Cette action est irréversible. Toutes vos données seront définitivement supprimées.',
      confirmText: 'Supprimer définitivement',
      cancelText: 'Annuler',
      variant: 'destructive',
      icon: 'alert',
      onConfirm: async () => {
        const result = await securityActions.deleteAccount();
        
        if (result.success) {
          showSuccess('Compte supprimé', result.message);
          router.push('/');
        } else {
          showError('Erreur lors de la suppression', result.message);
        }
      }
    });
  };

  const handleAvatarUpload = async (url: string) => {
    if (!user) return;
    
    try {
      const supabase = createClient();
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar: url })
        .eq('id', user.id);

      if (updateError) {
        throw updateError;
      }

      setProfile(prev => prev ? { ...prev, avatar: url } : null);
      showSuccess('Avatar mis à jour', 'Votre photo de profil a été mise à jour avec succès');
    } catch (error) {
      console.error('Erreur lors de la mise à jour du profil:', error);
      showError('Erreur lors de la mise à jour', 'Impossible de mettre à jour votre avatar');
    }
  };

  const handleUpdateProfile = async () => {
    if (!user) return;
    
    try {
      // Validation et nettoyage côté client pour une sécurité renforcée
      const sanitizedData = {
        username: username.trim(),
        description: description.trim().substring(0, 500), // Assurer la limite
        birth_date: birthDate || null,
        country: country || null
      };

      const supabase = createClient();
      const { error } = await supabase
        .from('profiles')
        .update(sanitizedData)
        .eq('id', user.id);

      if (error) throw error;

                 setProfile(prev => prev ? {
             ...prev,
             username,
             description,
             birth_date: birthDate || null,
             country: country || null
           } : null);
           showSuccess('Profil mis à jour avec succès', 'Vos informations ont été sauvegardées');
         } catch (error) {
           console.error('Erreur lors de la mise à jour du profil:', error);
           showError('Erreur lors de la mise à jour', 'Impossible de sauvegarder vos modifications');
    }
  };



  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-zinc-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-[#FF7101]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col gap-8">
          {/* En-tête du profil */}
          <Card className="bg-zinc-800/50 border-zinc-700">
            <CardHeader className="flex flex-col items-center gap-4">
              <AvatarUpload
                avatar={profile?.avatar || null}
                onUpload={handleAvatarUpload}
                email={user?.email || ''}
              />
              <div className="text-center">
                <div className="flex items-center justify-center mb-2">
                  <CardTitle className="text-2xl text-white">{profile?.username || "Utilisateur"}</CardTitle>
                </div>
                <CardDescription>{user?.email}</CardDescription>
              </div>
            </CardHeader>
          </Card>

          {/* Onglets */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="bg-zinc-800/50 border-zinc-700">
              <TabsTrigger value="profile">Profil</TabsTrigger>
              <RoleGuard requiredRole="seller" hideOnRestricted={true}>
                <TabsTrigger value="resources">Mes Ressources</TabsTrigger>
              </RoleGuard>
              <TabsTrigger value="security">Sécurité</TabsTrigger>
            </TabsList>
            <TabsContent value="profile">
              <Card className="bg-zinc-800/50 border-zinc-700">
                <CardHeader>
                  <CardTitle className="text-white">Informations du profil</CardTitle>
                  <CardDescription>
                    Modifiez votre nom d'utilisateur et vos informations personnelles
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-200">Nom d'utilisateur</label>
                    <Input
                      placeholder="Votre nom d'utilisateur"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="bg-zinc-700 border-zinc-600 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-200">Description</label>
                    <Textarea
                      placeholder="Décrivez-vous en quelques mots..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="bg-zinc-700 border-zinc-600 text-white min-h-[100px] resize-none"
                      maxLength={500}
                    />
                    <p className="text-xs text-zinc-500">{description.length}/500 caractères</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-200">Date de naissance</label>
                    <Input
                      type="date"
                      value={birthDate}
                      onChange={(e) => setBirthDate(e.target.value)}
                      className="bg-zinc-700 border-zinc-600 text-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-200">Pays</label>
                    <Select value={country} onValueChange={setCountry}>
                      <SelectTrigger className="bg-zinc-700 border-zinc-600 text-white">
                        <SelectValue placeholder="Sélectionnez votre pays" />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-800 border-zinc-700">
                        <SelectItem value="FR">🇫🇷 France</SelectItem>
                        <SelectItem value="BE">🇧🇪 Belgique</SelectItem>
                        <SelectItem value="CH">🇨🇭 Suisse</SelectItem>
                        <SelectItem value="CA">🇨🇦 Canada</SelectItem>
                        <SelectItem value="US">🇺🇸 États-Unis</SelectItem>
                        <SelectItem value="GB">🇬🇧 Royaume-Uni</SelectItem>
                        <SelectItem value="DE">🇩🇪 Allemagne</SelectItem>
                        <SelectItem value="ES">🇪🇸 Espagne</SelectItem>
                        <SelectItem value="IT">🇮🇹 Italie</SelectItem>
                        <SelectItem value="NL">🇳🇱 Pays-Bas</SelectItem>
                        <SelectItem value="PT">🇵🇹 Portugal</SelectItem>
                        <SelectItem value="PL">🇵🇱 Pologne</SelectItem>
                        <SelectItem value="SE">🇸🇪 Suède</SelectItem>
                        <SelectItem value="NO">🇳🇴 Norvège</SelectItem>
                        <SelectItem value="DK">🇩🇰 Danemark</SelectItem>
                        <SelectItem value="FI">🇫🇮 Finlande</SelectItem>
                        <SelectItem value="AU">🇦🇺 Australie</SelectItem>
                        <SelectItem value="JP">🇯🇵 Japon</SelectItem>
                        <SelectItem value="KR">🇰🇷 Corée du Sud</SelectItem>
                        <SelectItem value="BR">🇧🇷 Brésil</SelectItem>
                        <SelectItem value="MX">🇲🇽 Mexique</SelectItem>
                        <SelectItem value="AR">🇦🇷 Argentine</SelectItem>
                        <SelectItem value="CL">🇨🇱 Chili</SelectItem>
                        <SelectItem value="CO">🇨🇴 Colombie</SelectItem>
                        <SelectItem value="OTHER">🌍 Autre</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-200">Email</label>
                    <Input
                      type="email"
                      placeholder="Votre email"
                      value={user?.email || ''}
                      readOnly
                      className="bg-zinc-700 border-zinc-600 text-white"
                    />
                  </div>
                  <Button 
                    className="bg-[#FF7101] hover:bg-[#FF7101]/90 text-white"
                    onClick={handleUpdateProfile}
                  >
                    Sauvegarder les modifications
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="resources">
              <RoleGuard 
                requiredRole="seller" 
                showPromotionCard={true}
                fallback={
                  <div className="space-y-6">
                    {/* Contenu de l'onglet sera affiché après promotion */}
                  </div>
                }
              >
                {user && <ResourceManagement userId={user.id} />}
              </RoleGuard>
            </TabsContent>
            <TabsContent value="security">
              <div className="space-y-6">
                {/* Affichage de l'email (lecture seule) */}
                <Card className="bg-zinc-800/50 border-zinc-700">
                  <CardHeader>
                    <CardTitle className="text-white">Adresse Email</CardTitle>
                    <CardDescription>
                      Votre adresse email de connexion (non modifiable)
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div>
                      <label className="block text-sm font-medium text-zinc-300 mb-2">
                        Email
                      </label>
                      <p className="text-zinc-400 bg-zinc-900 p-3 rounded-md border border-zinc-700">
                        {user?.email}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Modification du mot de passe */}
                <Card className="bg-zinc-800/50 border-zinc-700">
                  <CardHeader>
                    <CardTitle className="text-white">Mot de Passe</CardTitle>
                    <CardDescription>
                      {authMethod.method === 'discord' 
                        ? "Vous avez créer votre compte via Discord. Pour changer votre mot de passe, un email de réinitialisation sera envoyé."
                        : "Modifiez votre mot de passe de connexion"
                      }
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {authMethod.method === 'discord' ? (
                      <>
                        <div className="bg-blue-900/20 border border-blue-800 rounded-md p-3">
                          <p className="text-sm text-blue-400">
                            💡 <strong>Compte Discord détecté</strong><br/>
                            Pour des raisons de sécurité, les utilisateurs connectés via Discord doivent utiliser la réinitialisation par email.
                          </p>
                        </div>
                        <Button 
                          onClick={handleSendPasswordResetEmail}
                          variant="outline" 
                          className="border-blue-600 text-blue-400 hover:bg-blue-600/10"
                          disabled={authMethod.loading}
                        >
                          Envoyer un email de réinitialisation
                        </Button>
                      </>
                    ) : (
                      <Button 
                        onClick={() => setShowPasswordDialog(true)}
                        variant="outline" 
                        className="border-zinc-600 text-white hover:bg-zinc-700"
                        disabled={authMethod.loading}
                      >
                        Changer le mot de passe
                      </Button>
                    )}
                  </CardContent>
                </Card>

                {/* Déconnexion */}
                <Card className="bg-zinc-800/50 border-zinc-700">
                  <CardHeader>
                    <CardTitle className="text-white">Déconnexion</CardTitle>
                    <CardDescription>
                      Se déconnecter de votre session actuelle
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button 
                      onClick={handleLogout}
                      variant="outline" 
                      className="border-yellow-600 text-yellow-400 hover:bg-yellow-600/10"
                    >
                      Se déconnecter
                    </Button>
                  </CardContent>
                </Card>

                {/* Suppression du compte */}
                <Card className="bg-red-900/20 border-red-800">
                  <CardHeader>
                    <CardTitle className="text-red-400">Zone de Danger</CardTitle>
                    <CardDescription>
                      Actions irréversibles concernant votre compte
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h4 className="text-sm font-medium text-red-400 mb-2">
                          Supprimer le compte
                        </h4>
                        <p className="text-sm text-zinc-400 mb-4">
                          Cette action est irréversible. Toutes vos données seront définitivement supprimées.
                        </p>
                        <Button 
                          onClick={() => setShowDeleteDialog(true)}
                          variant="destructive"
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Supprimer mon compte
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Dialog de suppression de compte */}
                <DeleteAccountDialog
                  open={showDeleteDialog}
                  onOpenChange={setShowDeleteDialog}
                  userEmail={user?.email || ''}
                />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Dialogues de confirmation */}

    {/* Dialog pour modification mot de passe */}
    <AlertDialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
      <AlertDialogContent className="bg-zinc-900 border-zinc-700 max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-white">Modifier le mot de passe</AlertDialogTitle>
          <AlertDialogDescription className="text-zinc-400">
            Pour votre sécurité, veuillez confirmer votre mot de passe actuel.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-4">
          {/* Mot de passe actuel */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">
              Mot de passe actuel *
            </label>
            <input
              type="password"
              placeholder="Votre mot de passe actuel"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#FF7101] focus:border-transparent"
            />
          </div>

          {/* Nouveau mot de passe */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">
              Nouveau mot de passe *
            </label>
            <input
              type="password"
              placeholder="Nouveau mot de passe sécurisé"
              value={securityPassword}
              onChange={(e) => handlePasswordChange(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#FF7101] focus:border-transparent"
            />
            
            {/* Indicateur de force du mot de passe */}
            {securityPassword && (
              <div className="mt-2">
                <div className="flex items-center gap-2 mb-1">
                  <div className="flex-1 bg-zinc-800 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${passwordStrength.level?.bg || 'bg-gray-500'}`}
                      style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                    ></div>
                  </div>
                  <span className={`text-xs font-medium ${passwordStrength.level?.color || 'text-gray-500'}`}>
                    {passwordStrength.level?.label || 'Faible'}
                  </span>
                </div>
                <p className="text-xs text-zinc-400">{passwordStrength.feedback}</p>
              </div>
            )}
          </div>

          {/* Confirmation */}
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-1">
              Confirmer le nouveau mot de passe *
            </label>
            <input
              type="password"
              placeholder="Répétez le nouveau mot de passe"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#FF7101] focus:border-transparent"
            />
            {confirmPassword && securityPassword !== confirmPassword && (
              <p className="text-xs text-red-400 mt-1">Les mots de passe ne correspondent pas</p>
            )}
          </div>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel 
            className="bg-zinc-800 text-white border-zinc-700 hover:bg-zinc-700"
            onClick={() => {
              setCurrentPassword('');
              setSecurityPassword('');
              setConfirmPassword('');
              setPasswordStrength({ score: 0, feedback: '' });
            }}
          >
            Annuler
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleUpdatePassword}
            disabled={!currentPassword || !securityPassword || !confirmPassword || passwordStrength.score < 3 || securityPassword !== confirmPassword}
            className="bg-[#FF7101] hover:bg-[#FF7101]/90 text-white disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Modifier le mot de passe
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>

      {/* Composant de confirmation personnalisé */}
      <ConfirmationDialogComponent />
    </div>
  );
}