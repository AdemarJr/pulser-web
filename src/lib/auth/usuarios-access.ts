import type { AuthSession } from "@/lib/auth/session";
import { PERMISSIONS, hasPermission } from "@/lib/auth/permissions";
import {
  podeAtribuirPerfil,
  podeGerenciarUsuario,
  podeVisualizarUsuario,
} from "@/lib/auth/perfil-hierarquia";

export type UsuarioComPerfil = {
  id: string;
  perfil?: { slug: string } | { slug: string }[] | null;
};

function slugPerfil(u: UsuarioComPerfil): string {
  const p = u.perfil;
  if (!p) return "";
  return Array.isArray(p) ? p[0]?.slug ?? "" : p.slug;
}

export function canViewUsuarios(session: AuthSession): boolean {
  return (
    hasPermission(session.permissions, PERMISSIONS.USUARIOS_VISUALIZAR) ||
    hasPermission(session.permissions, PERMISSIONS.USUARIOS_GERENCIAR)
  );
}

export function canManageUsuarios(session: AuthSession): boolean {
  return hasPermission(session.permissions, PERMISSIONS.USUARIOS_GERENCIAR);
}

export function canViewUsuario(
  session: AuthSession,
  alvo: UsuarioComPerfil
): boolean {
  if (!canViewUsuarios(session)) return false;
  return podeVisualizarUsuario(
    session.profile.perfil?.slug ?? "",
    slugPerfil(alvo),
    session.user.id === alvo.id
  );
}

export function canEditUsuario(
  session: AuthSession,
  alvo: UsuarioComPerfil
): boolean {
  if (!canManageUsuarios(session)) return false;
  return podeGerenciarUsuario(
    session.profile.perfil?.slug ?? "",
    slugPerfil(alvo),
    session.user.id === alvo.id
  );
}

export function canDeleteUsuario(
  session: AuthSession,
  alvo: UsuarioComPerfil
): boolean {
  return canEditUsuario(session, alvo);
}

export function canAssignPerfilId(
  session: AuthSession,
  perfilSlug: string
): boolean {
  if (!canManageUsuarios(session)) return false;
  return podeAtribuirPerfil(session.profile.perfil?.slug ?? "", perfilSlug);
}
