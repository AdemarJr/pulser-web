"use client";

import { UserCircle } from "lucide-react";
import { useAuth } from "@/components/layout/auth-context";
import { cn } from "@/lib/utils";

type Props = {
  variant?: "header" | "sidebar" | "compact";
  className?: string;
};

export function UserSessionBadge({ variant = "header", className }: Props) {
  const { auth, loading } = useAuth();

  if (loading) {
    return (
      <div
        className={cn(
          "animate-pulse rounded-lg bg-slate-200 dark:bg-slate-700",
          variant === "compact" ? "h-8 w-24" : "h-10 w-32",
          className
        )}
      />
    );
  }

  if (!auth) return null;

  const perfilNome = auth.perfil?.nome ?? "Sem perfil";

  if (variant === "compact") {
    return (
      <span
        className={cn(
          "truncate text-xs text-muted",
          className
        )}
        title={`${auth.nomeCompleto} — ${perfilNome}`}
      >
        {auth.nomeCompleto}
      </span>
    );
  }

  if (variant === "sidebar") {
    return (
      <div className={cn("rounded-lg bg-slate-900/80 px-3 py-2.5", className)}>
        <div className="flex items-start gap-2">
          <UserCircle className="mt-0.5 h-5 w-5 shrink-0 text-blue-400" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-white">{auth.nomeCompleto}</p>
            <p className="truncate text-xs text-slate-400">{auth.user.email}</p>
            <span className="mt-1.5 inline-block rounded-full bg-blue-600/30 px-2 py-0.5 text-xs font-medium text-blue-200">
              {perfilNome}
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "hidden max-w-[12rem] items-center gap-2 rounded-lg border border-border bg-slate-50 px-2.5 py-1.5 sm:flex dark:bg-slate-900/50",
        className
      )}
      title={auth.user.email}
    >
      <UserCircle className="h-8 w-8 shrink-0 text-blue-600 dark:text-blue-400" />
      <div className="min-w-0 text-left">
        <p className="truncate text-xs font-semibold text-foreground">{auth.nomeCompleto}</p>
        <p className="truncate text-[11px] text-muted">{perfilNome}</p>
      </div>
    </div>
  );
}
