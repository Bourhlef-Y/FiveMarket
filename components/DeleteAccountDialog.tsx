"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { toast } from '@/hooks/useToast';
import { Loader2 } from 'lucide-react';

interface DeleteAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userEmail: string;
}

export default function DeleteAccountDialog({
  open,
  onOpenChange,
  userEmail
}: DeleteAccountDialogProps) {
  const [confirmation, setConfirmation] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    if (confirmation.toLowerCase() !== 'supprimer mon compte') {
      toast({
        title: "Confirmation incorrecte",
        description: "Veuillez saisir exactement 'supprimer mon compte'",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);

      const response = await fetch('/api/account/delete', {
        method: 'DELETE',
        credentials: 'include'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erreur lors de la suppression');
      }

      toast({
        title: "Compte supprimé",
        description: "Votre compte a été supprimé avec succès. Au revoir !",
        variant: "default"
      });

      // Rediriger vers l'accueil
      router.push('/');
    } catch (error) {
      console.error('Erreur suppression:', error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Une erreur est survenue",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
      onOpenChange(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-zinc-900 border-zinc-800">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-xl text-white">
            Supprimer votre compte
          </AlertDialogTitle>
          <AlertDialogDescription className="text-zinc-400">
            Cette action est irréversible. Toutes vos données seront définitivement supprimées.
            <br /><br />
            Pour confirmer, écrivez &quot;supprimer mon compte&quot; ci-dessous :
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-red-900/20 border border-red-800 rounded-md p-3">
            <p className="text-sm text-red-400">
              ⚠️ <strong>Attention</strong><br />
              - Votre compte sera immédiatement supprimé<br />
              - Vos ressources seront supprimées<br />
              - Cette action ne peut pas être annulée
            </p>
          </div>

          <Input
            value={confirmation}
            onChange={(e) => setConfirmation(e.target.value)}
            placeholder="Écrivez 'supprimer mon compte'"
            className="bg-zinc-800 border-zinc-700 text-white"
          />
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel
            className="bg-zinc-800 text-white border-zinc-700 hover:bg-zinc-700"
            onClick={() => setConfirmation('')}
          >
            Annuler
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={loading || confirmation.toLowerCase() !== 'supprimer mon compte'}
            className="bg-red-600 hover:bg-red-700 text-white disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              'Supprimer définitivement'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
