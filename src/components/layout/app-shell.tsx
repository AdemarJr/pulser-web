"use client";

import { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileDrawer } from "@/components/layout/mobile-drawer";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";
import { MobileNavContext } from "@/components/layout/mobile-nav-context";
import { InstallPrompt } from "@/components/pwa/install-prompt";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <MobileNavContext.Provider value={{ openMenu: () => setMenuOpen(true) }}>
      <div className="flex h-[100dvh] min-h-0 overflow-hidden bg-background">
        <Sidebar />
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <main
            className="main-scroll min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-y-contain pb-[calc(4rem+env(safe-area-inset-bottom))] lg:pb-0"
            id="app-main-scroll"
          >
            {children}
          </main>
          <MobileBottomNav />
        </div>
        <MobileDrawer open={menuOpen} onOpenChange={setMenuOpen} />
        <InstallPrompt />
      </div>
    </MobileNavContext.Provider>
  );
}
