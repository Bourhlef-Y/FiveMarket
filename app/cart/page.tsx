"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ShoppingBag, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import NavBar from '@/components/NavBar';
import CartItem from '@/components/CartItem';
import { useCart } from '@/hooks/useCart';
import { ConfirmationDialog } from '@/components/ConfirmationDialog';

export default function CartPage() {
  const router = useRouter();
  const { items, loading, itemCount, total, clearCart } = useCart();
  const [showClearDialog, setShowClearDialog] = useState(false);

  const handleClearCart = async () => {
    await clearCart();
  };

  const handleCheckout = () => {
    // TODO: Rediriger vers checkout
    console.log('Redirection vers checkout');
  };

  // Panier vide
  if (items.length === 0 && !loading) {
    return (
      <div className="min-h-screen">
        <NavBar />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            {/* En-tête */}
            <div className="flex items-center gap-4 mb-8">
              <Button
                variant="ghost"
                onClick={() => router.back()}
                className="text-zinc-400 hover:text-white"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour
              </Button>
              <h1 className="text-3xl font-bold text-white">Mon Panier</h1>
            </div>

            {/* État vide */}
            <Card className="bg-zinc-800/50 border-zinc-700">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <ShoppingBag className="h-16 w-16 text-zinc-600 mb-4" />
                <h2 className="text-xl font-semibold text-white mb-2">Votre panier est vide</h2>
                <p className="text-zinc-400 text-center mb-6 max-w-md">
                  Découvrez notre marketplace et ajoutez des ressources à votre panier pour commencer.
                </p>
                <Button 
                  onClick={() => router.push('/')}
                  className="bg-[#FF7101] hover:bg-[#FF7101]/90 text-white"
                >
                  Découvrir le Marketplace
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <NavBar />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* En-tête */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => router.back()}
                className="text-zinc-400 hover:text-white"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-white">Mon Panier</h1>
                <p className="text-zinc-400">
                  {itemCount} article{itemCount > 1 ? 's' : ''}
                </p>
              </div>
            </div>

            {/* Vider le panier */}
            <Button
              variant="outline"
              onClick={() => setShowClearDialog(true)}
              disabled={loading}
              className="border-zinc-600 text-zinc-300 hover:text-red-400 hover:border-red-400"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Vider le panier
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Liste des articles */}
            <div className="lg:col-span-2 space-y-4">
              {items.map((item) => (
                <CartItem key={item.id} item={item} />
              ))}
            </div>

            {/* Résumé de commande */}
            <div className="lg:col-span-1">
              <Card className="bg-zinc-800/50 border-zinc-700 sticky top-8">
                <CardHeader>
                  <CardTitle className="text-xl text-white">Résumé de commande</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Détail des prix */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-zinc-300">
                      <span>Sous-total ({itemCount} article{itemCount > 1 ? 's' : ''})</span>
                      <span>{total === 0 ? 'Gratuit' : `${total.toFixed(2)}€`}</span>
                    </div>
                    
                    <div className="flex justify-between text-zinc-300">
                      <span>Frais de traitement</span>
                      <span className="text-green-400">Gratuit</span>
                    </div>
                  </div>

                  <Separator className="bg-zinc-700" />

                  {/* Total */}
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-white">Total</span>
                    <span className="text-2xl font-bold text-[#FF7101]">
                      {total === 0 ? 'Gratuit' : `${total.toFixed(2)}€`}
                    </span>
                  </div>

                  {/* Bouton de commande */}
                  <Button
                    onClick={handleCheckout}
                    disabled={loading}
                    className="w-full bg-[#FF7101] hover:bg-[#FF7101]/90 text-white text-lg py-6"
                  >
                    {total === 0 ? 'Télécharger' : 'Passer commande'}
                  </Button>

                  {/* Avantages */}
                  <div className="bg-zinc-700/30 rounded-lg p-4 space-y-2">
                    <div className="flex items-center gap-2 text-sm text-zinc-300">
                      <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                      <span>Téléchargement immédiat</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-zinc-300">
                      <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                      <span>Support vendeur inclus</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-zinc-300">
                      <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                      <span>Mises à jour gratuites</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Dialog de confirmation pour vider le panier */}
      <ConfirmationDialog
        isOpen={showClearDialog}
        onClose={() => setShowClearDialog(false)}
        onConfirm={handleClearCart}
        title="Vider le panier"
        description="Êtes-vous sûr de vouloir supprimer tous les articles de votre panier ? Cette action est irréversible."
        confirmText="Vider le panier"
        cancelText="Annuler"
        variant="destructive"
        icon="warning"
      />
    </div>
  );
}
