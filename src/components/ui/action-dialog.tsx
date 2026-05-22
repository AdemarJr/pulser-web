"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { CheckCircle2, AlertTriangle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void | Promise<void>;
  loading?: boolean;
  variant?: "default" | "destructive";
};

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  onConfirm,
  loading = false,
  variant = "default",
}: ConfirmDialogProps) {
  async function handleConfirm() {
    await onConfirm();
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out" />
        <Dialog.Content
          className={cn(
            "fixed left-1/2 top-1/2 z-50 w-[min(100vw-2rem,24rem)] -translate-x-1/2 -translate-y-1/2",
            "rounded-xl border border-border bg-card p-6 shadow-xl outline-none"
          )}
        >
          <div className="flex gap-3">
            <div
              className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                variant === "destructive"
                  ? "bg-red-100 text-red-600 dark:bg-red-950/50 dark:text-red-400"
                  : "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300"
              )}
            >
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <Dialog.Title className="text-lg font-semibold text-foreground">
                {title}
              </Dialog.Title>
              <Dialog.Description className="mt-2 text-sm text-muted">
                {description}
              </Dialog.Description>
            </div>
            <Dialog.Close
              className="shrink-0 rounded-lg p-1 text-muted hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Fechar"
            >
              <X className="h-4 w-4" />
            </Dialog.Close>
          </div>
          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              disabled={loading}
              onClick={() => onOpenChange(false)}
            >
              {cancelLabel}
            </Button>
            <Button
              type="button"
              variant={variant === "destructive" ? "destructive" : "default"}
              disabled={loading}
              onClick={() => void handleConfirm()}
            >
              {loading ? "Aguarde..." : confirmLabel}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

type SuccessDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  primaryLabel?: string;
  onPrimary: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
};

export function SuccessDialog({
  open,
  onOpenChange,
  title,
  description,
  primaryLabel = "Continuar",
  onPrimary,
  secondaryLabel,
  onSecondary,
}: SuccessDialogProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />
        <Dialog.Content
          className={cn(
            "fixed left-1/2 top-1/2 z-50 w-[min(100vw-2rem,24rem)] -translate-x-1/2 -translate-y-1/2",
            "rounded-xl border border-border bg-card p-6 shadow-xl outline-none"
          )}
        >
          <div className="flex flex-col items-center text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <Dialog.Title className="mt-4 text-lg font-semibold text-foreground">
              {title}
            </Dialog.Title>
            <Dialog.Description className="mt-2 text-sm text-muted">
              {description}
            </Dialog.Description>
          </div>
          <div className="mt-6 flex flex-col gap-2">
            <Button type="button" className="w-full" onClick={onPrimary}>
              {primaryLabel}
            </Button>
            {secondaryLabel && onSecondary && (
              <Button type="button" variant="outline" className="w-full" onClick={onSecondary}>
                {secondaryLabel}
              </Button>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
