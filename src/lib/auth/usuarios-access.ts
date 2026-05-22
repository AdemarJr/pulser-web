import type { AuthSession } from "@/lib/auth/session";
import { isGestorEquipe } from "@/lib/auth/eleitores-access";
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

export function slugPerfilUsuario(u: UsuarioComPerfil): string {
  const p = u.perfil;
  if (!p) return "";
  return Array.isArray(p) ? p[0]?.slug ?? "" : p.slug;
}

export function nomePerfilUsuario(
  u: { perfil?: { nome: string } | { nome: string }[] | null }
): string {
  const p = u.perfil;
  if (!p) return "—";
  if (Array.isArray(p)) return p[0]?.nome ?? "—";
  return p.nome ?? "—";
}

export function canViewUsuarios(session: AuthSession): boolean {
  return (
    isGestorEquipe(session) ||
    hasPermission(session.permissions, PERMISSIONS.USUARIOS_VISUALIZAR) ||
    hasPermission(session.permissions, PERMISSIONS.USUARIOS_GERENCIAR)
  );
}

/** Admin e coordenador veem toda a equipe (perfis na hierarquia). */
export function canViewAllUsuariosEquipe(session: AuthSession): boolean {
  return isGestorEquipe(session);
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
    slugPerfilUsuario(alvo),
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
    slugPerfilUsuario(alvo),
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
