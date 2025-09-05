"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Upload, DollarSign, Users, Star, Package, UserPlus } from "lucide-react";
import { useRouter } from 'next/navigation';
import { toast } from '@/hooks/useToast';
import { Toaster } from '@/components/ui/toaster';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';

export default function PublishPage() {
  const router = useRouter();
  const { user, profile, loading } = useAuth();
  const [sellerRequest, setSellerRequest] = useState<{
    status: 'pending' | 'approved' | 'rejected';
  } | null>(null);

  useEffect(() => {
    const fetchSellerRequest = async () => {
      if (!user) return;

      try {
        const response = await fetch('/api/account/seller-request');
        const data = await response.json();

        if (response.ok && data.request) {
          setSellerRequest(data.request);
        }
      } catch (error) {
        console.error('Erreur lors de la récupération de la demande de vendeur:', error);
      }
    };

    fetchSellerRequest();
  }, [user]);

  const handleStartPublishing = async () => {
    if (!user) {
      // Rediriger vers l'inscription
      router.push('/auth/sign-up');
      return;
    }

    // Si l'utilisateur est déjà vendeur
    if (profile?.role === 'seller') {
      router.push('/sell/new');
      return;
    }

    // Si l'utilisateur a une demande en cours
    if (sellerRequest?.status === 'pending') {
      toast({
        title: 'Request Pending',
        description: 'Your seller request is currently being processed.',
        variant: 'default'
      });
      return;
    }

    // Si l'utilisateur a une demande rejetée
    if (sellerRequest?.status === 'rejected') {
      toast({
        title: 'Request Rejected',
        description: 'Your previous seller request was rejected. Please contact support.',
        variant: 'destructive'
      });
      return;
    }

    // Si l'utilisateur est admin, ne pas permettre de devenir vendeur
    if (profile?.role === 'admin') {
      toast({
        title: 'Access Denied',
        description: 'Administrators cannot become sellers.',
        variant: 'destructive'
      });
      return;
    }

    // Si l'utilisateur est buyer ou n'a pas de rôle, rediriger vers le formulaire de demande
    router.push('/account/become-seller');
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-5xl font-bold text-white mb-6">
              Sell Your <span className="text-[#FF7101]">FiveM</span> Resources
            </h1>
            <p className="text-xl text-zinc-400 mb-8">
              Join our community and start selling your FiveM creations worldwide. 
              Whether you're a developer, designer or content creator, your place is here!
            </p>
            <Button 
              className="bg-[#FF7101] hover:bg-[#FF7101]/90 text-white px-8 py-6 text-lg"
              onClick={handleStartPublishing}
              disabled={loading}
            >
              {!user ? 'Start Selling' :
               profile?.role === 'seller' ? 'Add Resource' :
               (sellerRequest?.status === 'pending') ? 'Request Pending' :
               (sellerRequest?.status === 'rejected') ? 'Request Rejected' :
               (profile?.role === 'buyer' || !profile?.role) ? (
                 <>
                   <UserPlus className="w-5 h-5 mr-2" />
                   Become Seller
                 </>
               ) : 'Start Selling'}
            </Button>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-white mb-12">
            Why sell on FiveMarket?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="bg-zinc-800/50 border-zinc-700">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-full bg-[#FF7101]/20">
                    <DollarSign className="h-6 w-6 text-[#FF7101]" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-2">Monetize Your Creations</h3>
                    <p className="text-zinc-400">
                      Keep up to 80% of your resource sales price. One of the lowest commission rates on the market.
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
                    <h3 className="text-xl font-semibold text-white mb-2">Large Community</h3>
                    <p className="text-zinc-400">
                      Access an active community of FiveM server owners looking for quality resources.
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
                    <h3 className="text-xl font-semibold text-white mb-2">Easy Selling</h3>
                    <p className="text-zinc-400">
                      Simple and intuitive interface to sell your resources. No need to be a technical expert.
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
                    <h3 className="text-xl font-semibold text-white mb-2">Community Support</h3>
                    <p className="text-zinc-400">
                      Benefit from community support and assistance to promote your creations.
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
            What can you sell?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="bg-zinc-800/50 border-zinc-700">
              <CardContent className="p-6 text-center">
                <Package className="h-12 w-12 text-[#FF7101] mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">Scripts & Resources</h3>
                <p className="text-zinc-400">
                  Lua scripts, complete resources, game systems, etc.
                </p>
              </CardContent>
            </Card>
            <Card className="bg-zinc-800/50 border-zinc-700">
              <CardContent className="p-6 text-center">
                <Star className="h-12 w-12 text-[#FF7101] mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">Maps & MLOs</h3>
                <p className="text-zinc-400">
                  Custom maps, interiors, terrain modifications.
                </p>
              </CardContent>
            </Card>
            <Card className="bg-zinc-800/50 border-zinc-700">
              <CardContent className="p-6 text-center">
                <Upload className="h-12 w-12 text-[#FF7101] mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">Assets & Textures</h3>
                <p className="text-zinc-400">
                  Vehicles, skins, textures, 3D models, sounds, etc.
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
            How does it work?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-[#FF7101] flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-white">1</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Create your account</h3>
              <p className="text-zinc-400">
                Sign up for free and complete your profile.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-[#FF7101] flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-white">2</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Sell your resources</h3>
              <p className="text-zinc-400">
                Upload your creations, add descriptions and set your prices.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-[#FF7101] flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-white">3</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Start earning</h3>
              <p className="text-zinc-400">
                Receive payments for each sale and build your reputation.
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
                Ready to sell your creations?
              </h2>
              <p className="text-white/90 mb-8 text-lg">
                Join our creator community and start selling your resources today.
              </p>
              <Button 
                className="bg-white text-[#FF7101] hover:bg-white/90 px-8 py-6 text-lg"
                onClick={handleStartPublishing}
                disabled={loading}
              >
                {!user ? 'Start now' :
                 profile?.role === 'seller' ? 'Add Resource' :
                 (sellerRequest?.status === 'pending') ? 'Request Pending' :
                 (sellerRequest?.status === 'rejected') ? 'Request Rejected' :
                 (profile?.role === 'buyer' || !profile?.role) ? 'Become Seller' : 'Start now'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>
      <Toaster />
    </div>
  );
}