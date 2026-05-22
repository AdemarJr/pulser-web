import { PERMISSIONS } from "@/lib/auth/permissions";
import {
  perfisAtribuiveis,
  podeAcessarModuloUsuarios,
  nivelPerfil,
} from "@/lib/auth/perfil-hierarquia";

export type AuthMeUsuarios = {
  user: { id: string };
  permissions: string[];
  perfilSlug: string;
  isSuperAdmin?: boolean;
};

export function authMeUsuariosFromApi(data: {
  user: { id: string };
  permissions?: string[];
  perfil?: { slug: string } | null;
  isSuperAdmin?: boolean;
}): AuthMeUsuarios {
  return {
    user: { id: data.user.id },
    permissions: data.permissions ?? [],
    perfilSlug: data.perfil?.slug ?? "",
    isSuperAdmin: data.isSuperAdmin === true,
  };
}

export function canAccessModuloUsuarios(me: AuthMeUsuarios): boolean {
  if (me.isSuperAdmin) return true;
  return podeAcessarModuloUsuarios(me.perfilSlug);
}

export function canManageUsuariosList(me: AuthMeUsuarios): boolean {
  if (!canAccessModuloUsuarios(me)) return false;
  if (me.isSuperAdmin || me.perfilSlug === "admin_geral") return true;
  return me.permissions.includes(PERMISSIONS.USUARIOS_GERENCIAR);
}

export function canViewUsuariosList(me: AuthMeUsuarios): boolean {
  return canAccessModuloUsuarios(me);
}

export function canEditUsuarioClient(
  me: AuthMeUsuarios,
  alvo: { id: string; perfil?: { slug: string } | { slug: string }[] | null }
): boolean {
  if (!canManageUsuariosList(me)) return false;
  if (me.user.id === alvo.id) return false;
  const slug =
    Array.isArray(alvo.perfil) ? alvo.perfil[0]?.slug : alvo.perfil?.slug ?? "";
  if (me.isSuperAdmin) return true;
  if (me.perfilSlug === "admin_geral") return slug !== "admin_geral";
  if (me.perfilSlug === "coordenador") {
    return nivelPerfil(slug) < nivelPerfil(me.perfilSlug);
  }
  return false;
}

export function canDeleteUsuarioClient(
  me: AuthMeUsuarios,
  alvo: { id: string; perfil?: { slug: string } | { slug: string }[] | null }
): boolean {
  return canEditUsuarioClient(me, alvo);
}

export function perfisAtribuiveisClient(me: AuthMeUsuarios): string[] {
  return perfisAtribuiveis(me.perfilSlug, me.isSuperAdmin === true);
}
