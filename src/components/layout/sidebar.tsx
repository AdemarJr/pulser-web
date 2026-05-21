"use client";

import { useEffect, useState } from "react";
import { LogOut } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { filterNavItems, navItems } from "@/components/layout/nav-config";
import { NavLinks } from "@/components/layout/nav-links";

export function Sidebar() {
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
    <aside className="hidden h-full w-64 shrink-0 flex-col border-r border-slate-800 bg-slate-950 text-slate-100 lg:flex">
      <div className="flex flex-col gap-1 border-b border-slate-800 px-4 py-4">
        <Logo size="sm" />
        <p className="truncate text-xs text-slate-400">
          {isAdmin ? "Administrador" : "Meus cadastros"}
        </p>
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
