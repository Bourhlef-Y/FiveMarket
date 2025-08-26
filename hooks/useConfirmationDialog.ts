'use client';

import { useState, useCallback } from 'react';
import { ConfirmationDialog } from '@/components/ConfirmationDialog';

export interface ConfirmationDialogOptions {
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'destructive' | 'warning' | 'info';
}

export interface ConfirmationDialogState {
  isOpen: boolean;
  options: ConfirmationDialogOptions;
  resolve?: (value: boolean) => void;
}

export function useConfirmationDialog() {
  const [state, setState] = useState<ConfirmationDialogState>({
    isOpen: false,
    options: { title: '' }
  });

  const showConfirmationDialog = useCallback((options: ConfirmationDialogOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setState({
        isOpen: true,
        options: {
          confirmText: 'Confirmer',
          cancelText: 'Annuler',
          variant: 'default',
          ...options
        },
        resolve
      });
    });
  }, []);

  const handleConfirm = useCallback(() => {
    setState(prev => ({ ...prev, isOpen: false }));
    if (state.resolve) {
      state.resolve(true);
    }
  }, [state.resolve]);

  const handleCancel = useCallback(() => {
    setState(prev => ({ ...prev, isOpen: false }));
    if (state.resolve) {
      state.resolve(false);
    }
  }, [state.resolve]);

  return {
    showConfirmationDialog,
    dialogProps: state.isOpen ? {
      isOpen: state.isOpen,
      onClose: handleCancel,
      onConfirm: handleConfirm,
      title: state.options.title,
      description: state.options.description,
      confirmText: state.options.confirmText,
      cancelText: state.options.cancelText,
      variant: state.options.variant
    } : null
  };
}
