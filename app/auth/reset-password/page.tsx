"use client";

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye, EyeOff, CheckCircle, XCircle, Lock } from "lucide-react";
import Link from 'next/link';

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isValidSession, setIsValidSession] = useState<boolean | null>(null);

  // États pour la validation du mot de passe
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    level: { label: 'Faible', color: 'text-red-500', bg: 'bg-red-500' },
    feedback: '',
    isValid: false
  });

  // Fonction de validation de la force du mot de passe
  const checkPasswordStrength = (password: string) => {
    let score = 0;
    let feedback = [];

    if (password.length >= 8) score += 1;
    else feedback.push('Au moins 8 caractères');

    if (/[A-Z]/.test(password)) score += 1;
    else feedback.push('Une majuscule');

    if (/[a-z]/.test(password)) score += 1;
    else feedback.push('Une minuscule');

    if (/\d/.test(password)) score += 1;
    else feedback.push('Un chiffre');

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
      isValid: score >= 3
    };
  };

  useEffect(() => {
    // Vérifier si nous avons une session valide pour la réinitialisation
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          setIsValidSession(true);
        } else {
          // Vérifier les paramètres d'URL pour les tokens
          const accessToken = searchParams.get('access_token');
          const refreshToken = searchParams.get('refresh_token');
          
          if (accessToken && refreshToken) {
            // Définir la session à partir des tokens URL
            const { error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken
            });
            
            if (!error) {
              setIsValidSession(true);
            } else {
              setIsValidSession(false);
              setError('Lien de réinitialisation invalide ou expiré');
            }
          } else {
            setIsValidSession(false);
            setError('Lien de réinitialisation manquant');
          }
        }
      } catch (error) {
        console.error('❌ Erreur vérification session:', error);
        setIsValidSession(false);
        setError('Erreur lors de la vérification du lien');
      }
    };

    checkSession();
  }, [searchParams]);

  const handlePasswordChange = (newPassword: string) => {
    setPassword(newPassword);
    setPasswordStrength(checkPasswordStrength(newPassword));
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password || !confirmPassword) {
      setError('Veuillez remplir tous les champs');
      return;
    }

    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    if (!passwordStrength.isValid) {
      setError(`Mot de passe trop faible. ${passwordStrength.feedback}`);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) {
        setError(error.message);
      } else {
        setSuccess('Mot de passe mis à jour avec succès ! Redirection...');
        setTimeout(() => {
          router.push('/account?tab=security');
        }, 2000);
      }
    } catch (error) {
      setError('Une erreur inattendue s\'est produite');
    } finally {
      setLoading(false);
    }
  };

  if (isValidSession === null) {
    return (
      <div className="min-h-screen bg-zinc-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-[#FF7101]"></div>
      </div>
    );
  }

  if (isValidSession === false) {
    return (
      <div className="min-h-screen bg-zinc-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-zinc-800 border-zinc-700">
          <CardHeader className="text-center">
            <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <CardTitle className="text-white">Lien invalide</CardTitle>
            <CardDescription className="text-zinc-400">
              {error || 'Le lien de réinitialisation est invalide ou a expiré.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/auth/sign-in">
              <Button className="w-full">
                Retour à la connexion
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-zinc-800 border-zinc-700">
        <CardHeader className="text-center">
          <Lock className="h-16 w-16 text-[#FF7101] mx-auto mb-4" />
          <CardTitle className="text-white">Nouveau mot de passe</CardTitle>
          <CardDescription className="text-zinc-400">
            Choisissez un nouveau mot de passe sécurisé pour votre compte
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Nouveau mot de passe */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">
                Nouveau mot de passe *
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Entrez votre nouveau mot de passe"
                  value={password}
                  onChange={(e) => handlePasswordChange(e.target.value)}
                  className="bg-zinc-700 border-zinc-600 text-white pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-zinc-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              
              {/* Indicateur de force */}
              {password && (
                <div className="mt-2">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="flex-1 bg-zinc-700 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${passwordStrength.level.bg}`}
                        style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                      ></div>
                    </div>
                    <span className={`text-xs font-medium ${passwordStrength.level.color}`}>
                      {passwordStrength.level.label}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400">{passwordStrength.feedback}</p>
                </div>
              )}
            </div>

            {/* Confirmation */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">
                Confirmer le mot de passe *
              </label>
              <Input
                type="password"
                placeholder="Répétez votre nouveau mot de passe"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="bg-zinc-700 border-zinc-600 text-white"
              />
              {confirmPassword && password !== confirmPassword && (
                <p className="text-xs text-red-400">Les mots de passe ne correspondent pas</p>
              )}
            </div>

            {/* Messages d'erreur et succès */}
            {error && (
              <Alert className="border-red-800 bg-red-900/50">
                <AlertDescription className="text-red-400">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="border-green-800 bg-green-900/50">
                <AlertDescription className="text-green-400 flex items-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  {success}
                </AlertDescription>
              </Alert>
            )}

            {/* Bouton de soumission */}
            <Button 
              type="submit" 
              className="w-full"
              disabled={loading || !password || !confirmPassword || !passwordStrength.isValid || password !== confirmPassword}
            >
              {loading ? 'Mise à jour...' : 'Mettre à jour le mot de passe'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
