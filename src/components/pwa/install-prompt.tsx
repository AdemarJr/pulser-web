"use client";

import { useEffect, useState } from "react";
import { Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const dismissedAt = localStorage.getItem("pwa-install-dismissed");
    if (dismissedAt) setDismissed(true);

    function onBip(e: Event) {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    }

    window.addEventListener("beforeinstallprompt", onBip);
    return () => window.removeEventListener("beforeinstallprompt", onBip);
  }, []);

  if (dismissed || !deferred) return null;

  async function install() {
    await deferred?.prompt();
    await deferred?.userChoice;
    setDeferred(null);
    localStorage.setItem("pwa-install-dismissed", "1");
  }

  function dismiss() {
    setDismissed(true);
    setDeferred(null);
    localStorage.setItem("pwa-install-dismissed", "1");
  }

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 mx-auto max-w-md rounded-xl border border-blue-200 bg-card p-4 shadow-lg dark:border-blue-900 lg:bottom-4">
      <div className="flex gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white">
          <Download className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">Instalar aplicativo</p>
          <p className="text-xs text-muted">
            Adicione à tela inicial para uso em campo, como um app nativo.
          </p>
          <div className="mt-3 flex gap-2">
            <Button type="button" size="sm" onClick={install}>
              Instalar
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={dismiss}>
              Agora não
            </Button>
          </div>
        </div>
        <button
          type="button"
          onClick={dismiss}
          className="shrink-0 text-muted"
          aria-label="Fechar"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
