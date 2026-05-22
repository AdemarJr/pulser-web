"use client";

import { Moon, Sun, Bell, Menu } from "lucide-react";
import { useTheme } from "@/components/theme/theme-provider";
import { useMobileNav } from "@/components/layout/mobile-nav-context";
import { UserSessionBadge } from "@/components/layout/user-session-badge";

export function Header({ title }: { title: string }) {
  const { theme, toggleTheme } = useTheme();
  const { openMenu } = useMobileNav();

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between gap-3 border-b border-border bg-card/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-card/80 sm:h-16 sm:px-6">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <button
          type="button"
          onClick={openMenu}
          className="rounded-lg p-2 text-muted hover:bg-slate-100 lg:hidden dark:hover:bg-slate-800"
          aria-label="Abrir menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <h1 className="truncate text-lg font-semibold text-foreground sm:text-xl">
          {title}
        </h1>
      </div>
      <div className="flex shrink-0 items-center gap-1 sm:gap-2">
        <div className="hidden sm:block">
          <UserSessionBadge variant="header" />
        </div>
        <div className="sm:hidden">
          <UserSessionBadge variant="compact" className="max-w-[6.5rem]" />
        </div>
        <button
          type="button"
          className="rounded-lg p-2.5 text-muted hover:bg-slate-100 dark:hover:bg-slate-800"
          aria-label="Notificações"
        >
          <Bell className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={toggleTheme}
          className="rounded-lg p-2.5 text-muted hover:bg-slate-100 dark:hover:bg-slate-800"
          aria-label={theme === "dark" ? "Ativar modo claro" : "Ativar modo escuro"}
        >
          {theme === "dark" ? (
            <Sun className="h-5 w-5" />
          ) : (
            <Moon className="h-5 w-5" />
          )}
        </button>
      </div>
    </header>
  );
}
