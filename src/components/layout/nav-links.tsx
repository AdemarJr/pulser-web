"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import type { NavItem } from "@/components/layout/nav-config";

type Props = {
  items: NavItem[];
  onNavigate?: () => void;
  variant?: "sidebar" | "drawer";
};

export function NavLinks({ items, onNavigate, variant = "sidebar" }: Props) {
  const pathname = usePathname();

  return (
    <nav className={cn("space-y-1", variant === "drawer" ? "p-2" : "")}>
      {items.map((item) => {
        const Icon = item.icon;
        const active =
          pathname === item.href ||
          (item.href !== "/dashboard" &&
            pathname.startsWith(item.href + "/") &&
            !items.some(
              (other) =>
                other.href !== item.href &&
                other.href.startsWith(item.href + "/") &&
                (pathname === other.href || pathname.startsWith(other.href + "/"))
            ));

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex min-h-11 items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
              active
                ? "bg-blue-600 text-white"
                : "text-slate-300 hover:bg-slate-800 hover:text-white"
            )}
          >
            <Icon className="h-5 w-5 shrink-0" />
            <span className="truncate">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
