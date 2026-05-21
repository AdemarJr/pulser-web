"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu } from "lucide-react";
import { cn } from "@/lib/utils";
import { filterNavItems, navItems } from "@/components/layout/nav-config";
import { useMobileNav } from "@/components/layout/mobile-nav-context";

export function MobileBottomNav() {
  const pathname = usePathname();
  const { openMenu } = useMobileNav();
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

  const visible = filterNavItems(navItems, permissions, isAdmin).filter(
    (i) => i.mobilePrimary
  );

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 flex border-t border-border bg-card pb-[env(safe-area-inset-bottom)] lg:hidden"
      aria-label="Navegação principal"
    >
      {visible.map((item) => {
        const Icon = item.icon;
        const active =
          pathname === item.href ||
          (item.href !== "/dashboard" &&
            pathname.startsWith(item.href + "/") &&
            !visible.some(
              (other) =>
                other.href !== item.href &&
                other.href.startsWith(item.href + "/") &&
                (pathname === other.href || pathname.startsWith(other.href + "/"))
            ));

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 px-1 text-[10px] font-medium",
              active ? "text-blue-600 dark:text-blue-400" : "text-muted"
            )}
          >
            <Icon className="h-5 w-5" />
            <span className="truncate">{item.label}</span>
          </Link>
        );
      })}
      <button
        type="button"
        onClick={openMenu}
        className="flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 px-1 text-[10px] font-medium text-muted"
      >
        <Menu className="h-5 w-5" />
        <span>Mais</span>
      </button>
    </nav>
  );
}
