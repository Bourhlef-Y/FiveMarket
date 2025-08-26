"use client";

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

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  variant?: 'default' | 'destructive';
  requiresConfirmation?: boolean;
  confirmationText?: string;
  userInput?: string;
  onUserInputChange?: (value: string) => void;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText = "Confirmer",
  cancelText = "Annuler",
  onConfirm,
  variant = 'default',
  requiresConfirmation = false,
  confirmationText = "",
  userInput = "",
  onUserInputChange
}: ConfirmDialogProps) {
  const isConfirmationValid = !requiresConfirmation || userInput === confirmationText;

  const handleConfirm = () => {
    if (isConfirmationValid) {
      onConfirm();
      onOpenChange(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-zinc-900 border-zinc-700">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-white">{title}</AlertDialogTitle>
          <AlertDialogDescription className="text-zinc-400">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        {requiresConfirmation && confirmationText && (
          <div className="space-y-2">
            <p className="text-sm text-zinc-400">
              Pour confirmer, tapez <span className="font-mono bg-zinc-800 px-1 rounded text-red-400">{confirmationText}</span> :
            </p>
            <input
              type="text"
              value={userInput}
              onChange={(e) => onUserInputChange?.(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#FF7101] focus:border-transparent"
              placeholder={confirmationText}
            />
          </div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel className="bg-zinc-800 text-white border-zinc-700 hover:bg-zinc-700">
            {cancelText}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={!isConfirmationValid}
            className={
              variant === 'destructive'
                ? "bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                : "bg-[#FF7101] hover:bg-[#FF7101]/90 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            }
          >
            {confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
