"use client";

import { LogOut } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { useAuth } from "@/components/layout/auth-context";
import { filterNavItems, navItems } from "@/components/layout/nav-config";
import { NavLinks } from "@/components/layout/nav-links";
import { UserSessionBadge } from "@/components/layout/user-session-badge";

export function Sidebar() {
  const { auth } = useAuth();

  const visible = filterNavItems(navItems, auth?.permissions ?? [], {
    gestaoEleitores: auth?.canViewAllEleitores === true,
    moduloUsuarios: auth?.canAccessUsuarios === true,
  });

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  return (
    <aside className="hidden h-full w-64 shrink-0 flex-col border-r border-slate-800 bg-slate-950 text-slate-100 lg:flex">
      <div className="flex flex-col gap-3 border-b border-slate-800 px-4 py-4">
        <Logo size="sm" />
        <UserSessionBadge variant="sidebar" />
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        <NavLinks items={visible} />
      </div>
      <div className="border-t border-slate-800 p-4">
        <button
          type="button"
          onClick={handleLogout}
          className="flex min-h-11 w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-300 hover:bg-slate-800 hover:text-white"
        >
          <LogOut className="h-5 w-5" />
          Sair
        </button>
      </div>
    </aside>
  );
}
