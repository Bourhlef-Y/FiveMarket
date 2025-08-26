"use client";

import { toast } from "@/hooks/useToast";
import { CheckCircle2, AlertCircle, AlertTriangle, Info } from "lucide-react";

export function useCustomAlert() {
  const success = (title: string, description?: string) => {
    return toast({
      title: (
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4" />
          <span>{title}</span>
        </div>
      ),
      description,
      variant: 'success',
    });
  };

  const error = (title: string, description?: string) => {
    return toast({
      title: (
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          <span>{title}</span>
        </div>
      ),
      description,
      variant: 'destructive',
    });
  };

  const warning = (title: string, description?: string) => {
    return toast({
      title: (
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          <span>{title}</span>
        </div>
      ),
      description,
      variant: 'warning',
    });
  };

  const info = (title: string, description?: string) => {
    return toast({
      title: (
        <div className="flex items-center gap-2">
          <Info className="h-4 w-4" />
          <span>{title}</span>
        </div>
      ),
      description,
      variant: 'default',
    });
  };

  return {
    success,
    error,
    warning,
    info,
  };
}
