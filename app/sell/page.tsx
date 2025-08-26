"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Upload, DollarSign, Users, Star, Package, UserPlus } from "lucide-react";
import { useRouter } from 'next/navigation';
import { toast } from '@/hooks/useToast';
import { Toaster } from '@/components/ui/toaster';
import { useAuth } from '@/contexts/AuthContext';

export default function PublishPage() {
  const router = useRouter();
  const { user, profile, loading } = useAuth();

  const handleStartPublishing = async () => {
    if (!user) {
      // Rediriger vers l'inscription
      router.push('/auth/sign-up');
      return;
    }

    // Si l'utilisateur est déjà vendeur ou admin
    if (profile?.role === 'seller' || profile?.role === 'admin') {
      router.push('/sell/new');
      return;
    }

    // Si l'utilisateur est buyer, rediriger vers le formulaire Google
    if (profile?.role === 'buyer' || !profile?.role) {
      // TODO: Remplacer ce lien par le vrai formulaire Google quand il sera prêt
      const googleFormUrl = "#"; // Mettre ici l'URL du formulaire Google
      
      if (googleFormUrl === "#") {
        toast({
          title: 'En cours de préparation',
          description: 'Le formulaire de demande vendeur sera bientôt disponible.',
          variant: 'default'
        });
        return;
      }
      
      window.open(googleFormUrl, '_blank');
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-5xl font-bold text-white mb-6">
              Vendez vos Ressources <span className="text-[#FF7101]">FiveM</span>
            </h1>
            <p className="text-xl text-zinc-400 mb-8">
              Rejoignez notre communauté et commencez à vendre vos créations FiveM avec le monde entier. 
              Que vous soyez développeur, designer ou créateur de contenu, votre place est ici !
            </p>
            <Button 
              className="bg-[#FF7101] hover:bg-[#FF7101]/90 text-white px-8 py-6 text-lg"
              onClick={handleStartPublishing}
              disabled={loading}
            >
              {!user ? 'Commencer à vendre' :
               (profile?.role === 'seller' || profile?.role === 'admin') ? 'Ajouter une ressource' :
               (profile?.role === 'buyer' || !profile?.role) ? (
                 <>
                   <UserPlus className="w-5 h-5 mr-2" />
                   Devenir Vendeur
                 </>
               ) : 'Commencer à vendre'}
            </Button>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-white mb-12">
            Pourquoi vendre sur FiveMarket ?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="bg-zinc-800/50 border-zinc-700">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-full bg-[#FF7101]/20">
                    <DollarSign className="h-6 w-6 text-[#FF7101]" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">Monétisez vos Créations</h3>
                    <p className="text-zinc-400">
                      Gardez jusqu'à 80% du prix de vente de vos ressources. Des commissions parmi les plus basses du marché.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-zinc-800/50 border-zinc-700">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-full bg-[#FF7101]/20">
                    <Users className="h-6 w-6 text-[#FF7101]" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">Large Communauté</h3>
                    <p className="text-zinc-400">
                      Accédez à une communauté active de propriétaires de serveurs FiveM à la recherche de ressources de qualité.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-zinc-800/50 border-zinc-700">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-full bg-[#FF7101]/20">
                    <Upload className="h-6 w-6 text-[#FF7101]" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">Vente Facile</h3>
                    <p className="text-zinc-400">
                      Interface simple et intuitive pour vendre vos ressources. Pas besoin d'être un expert technique.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-zinc-800/50 border-zinc-700">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-full bg-[#FF7101]/20">
                    <Star className="h-6 w-6 text-[#FF7101]" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">Support Communautaire</h3>
                    <p className="text-zinc-400">
                      Bénéficiez du soutien de la communauté et d'une assistance pour promouvoir vos créations.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* What You Can Publish Section */}
      <section className="py-16 bg-zinc-800/30">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-white mb-12">
            Que pouvez-vous vendre ?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="bg-zinc-800/50 border-zinc-700">
              <CardContent className="p-6 text-center">
                <Package className="h-12 w-12 text-[#FF7101] mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">Scripts & Ressources</h3>
                <p className="text-zinc-400">
                  Scripts Lua, ressources complètes, systèmes de jeu, etc.
                </p>
              </CardContent>
            </Card>
            <Card className="bg-zinc-800/50 border-zinc-700">
              <CardContent className="p-6 text-center">
                <Star className="h-12 w-12 text-[#FF7101] mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">Maps & MLOs</h3>
                <p className="text-zinc-400">
                  Cartes personnalisées, intérieurs, modifications de terrain.
                </p>
              </CardContent>
            </Card>
            <Card className="bg-zinc-800/50 border-zinc-700">
              <CardContent className="p-6 text-center">
                <Upload className="h-12 w-12 text-[#FF7101] mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">Assets & Textures</h3>
                <p className="text-zinc-400">
                  Véhicules, skins, textures, modèles 3D, sons, etc.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-white mb-12">
            Comment ça marche ?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-[#FF7101] flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-white">1</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Créez votre compte</h3>
              <p className="text-zinc-400">
                Inscrivez-vous gratuitement et complétez votre profil.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-[#FF7101] flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-white">2</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Vendez vos ressources</h3>
              <p className="text-zinc-400">
                Téléchargez vos créations, ajoutez des descriptions et définissez vos prix.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-[#FF7101] flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-white">3</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Commencez à gagner</h3>
              <p className="text-zinc-400">
                Recevez des paiements pour chaque vente et construisez votre réputation.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <Card className="bg-[#FF7101] border-none">
            <CardContent className="p-12 text-center">
              <h2 className="text-3xl font-bold text-white mb-4">
                Prêt à vendre vos créations ?
              </h2>
              <p className="text-white/90 mb-8 text-lg">
                Rejoignez notre communauté de créateurs et commencez à vendre vos ressources dès aujourd'hui.
              </p>
              <Button 
                className="bg-white text-[#FF7101] hover:bg-white/90 px-8 py-6 text-lg"
                onClick={handleStartPublishing}
                disabled={loading}
              >
                {!user ? 'Commencer maintenant' :
                 (profile?.role === 'seller' || profile?.role === 'admin') ? 'Ajouter une ressource' :
                 (profile?.role === 'buyer' || !profile?.role) ? 'Devenir Vendeur' : 'Commencer maintenant'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>
      <Toaster />
    </div>
  );
}