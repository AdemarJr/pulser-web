import type { AuthSession } from "@/lib/auth/session";
import { PERMISSIONS, hasPermission } from "@/lib/auth/permissions";
import {
  podeAcessarModuloUsuarios,
  podeAtribuirPerfil,
  podeGerenciarUsuario,
  podeVisualizarUsuario,
} from "@/lib/auth/perfil-hierarquia";
import { isSuperAdmin } from "@/lib/auth/super-admin";

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

function slugAtor(session: AuthSession): string {
  return session.profile.perfil?.slug ?? "";
}

function superAdmin(session: AuthSession): boolean {
  return isSuperAdmin(session);
}

/** Apenas Admin Geral, Coordenador e Super Admin (conta bootstrap). */
export function canViewUsuarios(session: AuthSession): boolean {
  if (superAdmin(session)) return true;
  return podeAcessarModuloUsuarios(slugAtor(session));
}

export function canViewAllUsuariosEquipe(session: AuthSession): boolean {
  return canViewUsuarios(session);
}

export function canManageUsuarios(session: AuthSession): boolean {
  if (!canViewUsuarios(session)) return false;
  if (superAdmin(session) || slugAtor(session) === "admin_geral") return true;
  return hasPermission(session.permissions, PERMISSIONS.USUARIOS_GERENCIAR);
}

export function canViewUsuario(
  session: AuthSession,
  alvo: UsuarioComPerfil
): boolean {
  if (!canViewUsuarios(session)) return false;
  return podeVisualizarUsuario(
    slugAtor(session),
    slugPerfilUsuario(alvo),
    session.user.id === alvo.id,
    superAdmin(session)
  );
}

export function canEditUsuario(
  session: AuthSession,
  alvo: UsuarioComPerfil
): boolean {
  if (!canManageUsuarios(session)) return false;
  return podeGerenciarUsuario(
    slugAtor(session),
    slugPerfilUsuario(alvo),
    session.user.id === alvo.id,
    superAdmin(session)
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
  return podeAtribuirPerfil(
    slugAtor(session),
    perfilSlug,
    superAdmin(session)
  );
}
