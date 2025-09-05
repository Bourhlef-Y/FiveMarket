"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/useToast";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export default function BecomeSeller() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const [formData, setFormData] = useState({
    businessName: '',
    businessType: '',
    motivation: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation de base
    if (!formData.businessName || !formData.businessType || !formData.motivation) {
      toast({
        title: 'Erreur',
        description: 'Veuillez remplir tous les champs',
        variant: 'destructive'
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/account/seller-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          businessName: formData.businessName,
          businessType: formData.businessType,
          motivation: formData.motivation
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erreur lors de la soumission de la demande');
      }

      toast({
        title: 'Succès',
        description: 'Votre demande de vendeur a été soumise avec succès',
        variant: 'default'
      });

      // Rediriger vers la page de profil
      router.push('/account');
    } catch (error) {
      console.error('Erreur:', error);
      toast({
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Une erreur est survenue',
        variant: 'destructive'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Si l'utilisateur a déjà une demande en cours, le rediriger
  if (profile?.role === 'seller') {
    router.push('/account');
    return null;
  }

  // Si l'utilisateur est admin, ne pas permettre d'accéder à cette page
  if (profile?.role === 'admin') {
    router.push('/account');
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="max-w-2xl mx-auto bg-zinc-800/50 border-zinc-700">
        <CardHeader>
          <CardTitle className="text-2xl text-white">Devenir Vendeur</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="businessName">Nom de l'entreprise</Label>
              <Input 
                id="businessName"
                name="businessName"
                value={formData.businessName}
                onChange={handleInputChange}
                placeholder="Entrez le nom de votre entreprise"
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="businessType">Type d'entreprise</Label>
              <Select 
                value={formData.businessType}
                onValueChange={(value) => setFormData(prev => ({
                  ...prev,
                  businessType: value
                }))}
              >
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Sélectionnez un type d'entreprise" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="freelance">Freelance</SelectItem>
                  <SelectItem value="startup">Startup</SelectItem>
                  <SelectItem value="small_business">Petite Entreprise</SelectItem>
                  <SelectItem value="agency">Agence</SelectItem>
                  <SelectItem value="other">Autre</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="motivation">Motivation</Label>
              <Textarea 
                id="motivation"
                name="motivation"
                value={formData.motivation}
                onChange={handleInputChange}
                placeholder="Expliquez pourquoi vous souhaitez devenir vendeur sur notre plateforme"
                className="mt-2 min-h-[120px]"
              />
            </div>

            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full bg-[#FF7101] hover:bg-[#FF7101]/90 text-white"
            >
              {isSubmitting ? 'Soumission en cours...' : 'Soumettre ma demande'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
