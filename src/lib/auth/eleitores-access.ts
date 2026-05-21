import type { AuthSession } from "@/lib/auth/session";
import { PERMISSIONS, hasPermission } from "@/lib/auth/permissions";

/** Apenas administrador geral enxerga todos os cadastros. */
export function canViewAllEleitores(session: AuthSession): boolean {
  const slug = session.profile.perfil?.slug;
  if (slug === "admin_geral") return true;
  return hasPermission(session.permissions, PERMISSIONS.ELEITORES_VISUALIZAR_TODOS);
}

export function canViewEleitores(session: AuthSession): boolean {
  return (
    canViewAllEleitores(session) ||
    hasPermission(session.permissions, PERMISSIONS.ELEITORES_VISUALIZAR)
  );
}

export function isEleitorOwnedByUser(
  cadastradoPor: string | null | undefined,
  userId: string
): boolean {
  return cadastradoPor === userId;
}
