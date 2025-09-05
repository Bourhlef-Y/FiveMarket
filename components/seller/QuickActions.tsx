"use client";

import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Plus, 
  Package, 
  BarChart3, 
  Settings, 
  MessageSquare,
  HelpCircle,
  Zap
} from 'lucide-react';

export default function QuickActions() {
  const router = useRouter();

  const actions = [
    {
      label: 'Nouveau produit',
      description: 'Créer une nouvelle ressource',
      icon: Plus,
      color: 'bg-[#FF7101] hover:bg-[#FF7101]/90',
      onClick: () => router.push('/sell/new')
    },
    {
      label: 'Gérer produits',
      description: 'Modifier vos ressources',
      icon: Package,
      color: 'bg-blue-600 hover:bg-blue-700',
      onClick: () => router.push('/seller/products')
    },
    {
      label: 'Analytics',
      description: 'Voir les détails',
      icon: BarChart3,
      color: 'bg-purple-600 hover:bg-purple-700',
      onClick: () => router.push('/seller/analytics')
    },
    {
      label: 'Paramètres',
      description: 'Configuration vendeur',
      icon: Settings,
      color: 'bg-zinc-600 hover:bg-zinc-700',
      onClick: () => router.push('/seller/settings')
    }
  ];

  return (
    <Card className="bg-zinc-800/50 border-zinc-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Zap className="h-5 w-5" />
          Actions rapides
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {actions.map((action, index) => {
          const IconComponent = action.icon;
          return (
            <Button
              key={index}
              onClick={action.onClick}
              className={`w-full justify-start h-auto p-4 ${action.color} text-white`}
            >
              <div className="flex items-center gap-3 w-full">
                <IconComponent className="h-5 w-5" />
                <div className="text-left">
                  <div className="font-medium">{action.label}</div>
                  <div className="text-xs opacity-80">{action.description}</div>
                </div>
              </div>
            </Button>
          );
        })}
        
        {/* Section Aide */}
        <div className="pt-4 border-t border-zinc-700">
          <h4 className="text-zinc-400 text-sm font-medium mb-3">Besoin d'aide ?</h4>
          <div className="space-y-2">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-zinc-400 hover:text-white hover:bg-zinc-700"
              onClick={() => router.push('/support')}
            >
              <HelpCircle className="h-4 w-4 mr-2" />
              Centre d'aide
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-zinc-400 hover:text-white hover:bg-zinc-700"
              onClick={() => router.push('/contact')}
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Contacter le support
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
