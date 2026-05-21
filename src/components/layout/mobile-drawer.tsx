"use client";

import { useEffect, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { LogOut, X } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { filterNavItems, navItems } from "@/components/layout/nav-config";
import { NavLinks } from "@/components/layout/nav-links";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function MobileDrawer({ open, onOpenChange }: Props) {
  const [permissions, setPermissions] = useState<string[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((j) => {
        if (j.success) {
          setPermissions(j.data.permissions ?? []);
          setIsAdmin(j.data.canViewAllEleitores === true);
        }
      });
  }, []);

  const visible = filterNavItems(navItems, permissions, isAdmin);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm lg:hidden" />
        <Dialog.Content className="fixed inset-y-0 left-0 z-50 flex max-h-[100dvh] w-[min(100vw-3rem,18rem)] min-h-0 flex-col overflow-hidden bg-slate-950 text-slate-100 shadow-xl outline-none lg:hidden">
          <div className="flex h-16 shrink-0 items-center justify-between border-b border-slate-800 px-4">
            <Logo size="sm" />
            <Dialog.Close className="rounded-lg p-2 hover:bg-slate-800" aria-label="Fechar">
              <X className="h-5 w-5" />
            </Dialog.Close>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain py-2">
            <NavLinks
              items={visible}
              variant="drawer"
              onNavigate={() => onOpenChange(false)}
            />
          </div>
          <div className="shrink-0 border-t border-slate-800 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
            <button
              type="button"
              onClick={handleLogout}
              className="flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-sm text-slate-300 hover:bg-slate-800"
            >
              <LogOut className="h-5 w-5" />
              Sair
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
