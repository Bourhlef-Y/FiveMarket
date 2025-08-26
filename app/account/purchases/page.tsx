"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, ExternalLink, Star } from "lucide-react";
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

// Déplacer l'interface Purchase à l'extérieur du composant
interface Purchase {
  id: string;
  created_at: string;
  amount: number;
  status: 'completed' | 'pending' | 'cancelled';
  resource: {
    id: string;
    title: string;
    description: string;
    thumbnail_url: string;
    framework: string;
    version: string;
  };
}

// Créer un composant séparé pour le loader
function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-[#FF7101]"></div>
    </div>
  );
}

// Créer un composant séparé pour l'état vide
function EmptyState({ onExplore }: { onExplore: () => void }) {
  return (
    <Card className="bg-zinc-800/50 border-zinc-700">
      <CardContent className="flex flex-col items-center justify-center py-12">
        <div className="rounded-full bg-zinc-700/30 p-4 mb-4">
          <Download className="h-8 w-8 text-zinc-500" />
        </div>
        <h3 className="text-xl font-semibold text-white mb-2">Aucun achat pour le moment</h3>
        <p className="text-zinc-400 mb-4 text-center max-w-md">
          Explorez notre marketplace pour découvrir des scripts de qualité pour votre serveur FiveM
        </p>
        <Button 
          className="bg-[#FF7101] hover:bg-[#FF7101]/90 text-white"
          onClick={onExplore}
        >
          Explorer le Marketplace
        </Button>
      </CardContent>
    </Card>
  );
}

// Composant principal
export default function PurchasesPage() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let mounted = true;

    const fetchPurchases = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          router.push('/auth/sign-in');
          return;
        }

        const { data, error } = await supabase
          .from('orders')
          .select(`
            *,
            resource:resource_id (
              id,
              title,
              description,
              thumbnail_url,
              framework,
              version
            )
          `)
          .eq('buyer_id', session.user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;
        if (mounted) {
          setPurchases(data || []);
          setLoading(false);
        }
      } catch (error) {
        console.error('Erreur lors de la récupération des achats:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchPurchases();

    return () => {
      mounted = false;
    };
  }, [router]);

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Mes Achats</h1>
          <p className="text-zinc-400">Gérez et téléchargez vos scripts achetés</p>
        </div>

        {purchases.length === 0 ? (
          <EmptyState onExplore={() => router.push('/marketplace')} />
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {/* ... Reste du code pour l'affichage des achats ... */}
          </div>
        )}
      </div>
    </div>
  );
}