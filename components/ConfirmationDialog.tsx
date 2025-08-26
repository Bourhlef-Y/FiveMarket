"use client";

import { useState } from 'react';
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
import { AlertCircle, CheckCircle2, AlertTriangle, Info } from "lucide-react";

export interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'destructive' | 'warning' | 'info';
  icon?: 'alert' | 'check' | 'warning' | 'info';
}

export function ConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Confirmer",
  cancelText = "Annuler",
  variant = 'default',
  icon = 'alert'
}: ConfirmationDialogProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      await onConfirm();
      onClose();
    } catch (error) {
      console.error('Erreur lors de la confirmation:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getIcon = () => {
    switch (icon) {
      case 'check':
        return <CheckCircle2 className="h-6 w-6 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-6 w-6 text-yellow-500" />;
      case 'info':
        return <Info className="h-6 w-6 text-blue-500" />;
      case 'alert':
      default:
        return <AlertCircle className="h-6 w-6 text-red-500" />;
    }
  };

  const getButtonStyles = () => {
    switch (variant) {
      case 'destructive':
        return "bg-red-600 hover:bg-red-700 text-white";
      case 'warning':
        return "bg-yellow-600 hover:bg-yellow-700 text-white";
      case 'info':
        return "bg-blue-600 hover:bg-blue-700 text-white";
      case 'default':
      default:
        return "bg-[#FF7101] hover:bg-[#FF7101]/90 text-white";
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent className="bg-zinc-900 border-zinc-700">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            {getIcon()}
            <AlertDialogTitle className="text-white text-lg">
              {title}
            </AlertDialogTitle>
          </div>
          {description && (
            <AlertDialogDescription className="text-zinc-400">
              {description}
            </AlertDialogDescription>
          )}
        </AlertDialogHeader>
        
        <AlertDialogFooter>
          <AlertDialogCancel 
            className="bg-zinc-800 text-white border-zinc-700 hover:bg-zinc-700"
            disabled={isLoading}
          >
            {cancelText}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isLoading}
            className={`${getButtonStyles()} disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isLoading ? 'Chargement...' : confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// Hook pour utiliser facilement les dialogs de confirmation
export function useConfirmationDialog() {
  const [dialog, setDialog] = useState<{
    isOpen: boolean;
    props: Omit<ConfirmationDialogProps, 'isOpen' | 'onClose'>;
  }>({
    isOpen: false,
    props: {
      onConfirm: () => {},
      title: '',
    },
  });

  const showConfirmation = (props: Omit<ConfirmationDialogProps, 'isOpen' | 'onClose'>) => {
    return new Promise<boolean>((resolve) => {
      setDialog({
        isOpen: true,
        props: {
          ...props,
          onConfirm: async () => {
            try {
              await props.onConfirm();
              resolve(true);
            } catch (error) {
              resolve(false);
              throw error;
            }
          },
        },
      });
    });
  };

  const closeDialog = () => {
    setDialog(prev => ({ ...prev, isOpen: false }));
  };

  const ConfirmationDialogComponent = () => (
    <ConfirmationDialog
      {...dialog.props}
      isOpen={dialog.isOpen}
      onClose={closeDialog}
    />
  );

  return {
    showConfirmation,
    ConfirmationDialogComponent,
  };
}
