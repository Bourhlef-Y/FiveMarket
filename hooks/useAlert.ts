"use client";

import { toast } from "@/hooks/useToast";
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from "lucide-react";

export type AlertType = 'success' | 'error' | 'warning' | 'info' | 'confirm';

export interface AlertOptions {
  title?: string;
  description?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export interface ConfirmOptions {
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'destructive';
}

export function useAlert() {
  const showAlert = (type: AlertType, message: string, options?: AlertOptions) => {
    const { title, description, duration = 5000, action } = options || {};

    const getIcon = () => {
      switch (type) {
        case 'success':
          return CheckCircle2;
        case 'error':
          return X;
        case 'warning':
          return AlertTriangle;
        case 'info':
          return Info;
        default:
          return Info;
      }
    };

    const getVariant = () => {
      switch (type) {
        case 'success':
          return 'success' as const;
        case 'error':
          return 'destructive' as const;
        case 'warning':
          return 'warning' as const;
        case 'info':
        default:
          return 'default' as const;
      }
    };

    const Icon = getIcon();

    return toast({
      title: title || (
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4" />
          <span>
            {type === 'success' && 'Succès'}
            {type === 'error' && 'Erreur'}
            {type === 'warning' && 'Attention'}
            {type === 'info' && 'Information'}
          </span>
        </div>
      ),
      description: description || message,
      variant: getVariant(),
      duration,
      action: action ? {
        altText: action.label,
        children: action.label,
        onClick: action.onClick,
      } : undefined,
    });
  };

  // Fonctions raccourcies pour chaque type
  const success = (message: string, options?: AlertOptions) => 
    showAlert('success', message, options);

  const error = (message: string, options?: AlertOptions) => 
    showAlert('error', message, options);

  const warning = (message: string, options?: AlertOptions) => 
    showAlert('warning', message, options);

  const info = (message: string, options?: AlertOptions) => 
    showAlert('info', message, options);

  // Fonction de confirmation avec dialog personnalisé
  const confirm = (options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      // Créer un dialog de confirmation personnalisé
      const confirmToast = toast({
        title: (
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            <span>{options.title}</span>
          </div>
        ),
        description: options.description,
        variant: options.variant === 'destructive' ? 'destructive' : 'default',
        duration: 30000, // 30 secondes pour donner le temps de répondre
        action: {
          altText: options.confirmText || 'Confirmer',
          children: options.confirmText || 'Confirmer',
          onClick: () => {
            confirmToast.dismiss();
            resolve(true);
          },
        },
      });

      // Ajouter un bouton d'annulation via un second toast
      setTimeout(() => {
        toast({
          title: 'Appuyez sur X pour annuler',
          duration: 29000,
          variant: 'default',
        });
      }, 100);
    });
  };

  return {
    showAlert,
    success,
    error,
    warning,
    info,
    confirm,
  };
}
