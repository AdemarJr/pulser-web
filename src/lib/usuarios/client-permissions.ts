import { PERMISSIONS } from "@/lib/auth/permissions";
import { nivelPerfil } from "@/lib/auth/perfil-hierarquia";

export type AuthMeUsuarios = {
  user: { id: string };
  permissions: string[];
  perfilSlug: string;
};

export function authMeUsuariosFromApi(data: {
  user: { id: string };
  permissions?: string[];
  perfil?: { slug: string } | null;
}): AuthMeUsuarios {
  return {
    user: { id: data.user.id },
    permissions: data.permissions ?? [],
    perfilSlug: data.perfil?.slug ?? "",
  };
}

export function canManageUsuariosList(me: AuthMeUsuarios): boolean {
  return me.permissions.includes(PERMISSIONS.USUARIOS_GERENCIAR);
}

export function canViewUsuariosList(me: AuthMeUsuarios): boolean {
  return (
    me.permissions.includes(PERMISSIONS.USUARIOS_VISUALIZAR) ||
    me.permissions.includes(PERMISSIONS.USUARIOS_GERENCIAR)
  );
}

export function canEditUsuarioClient(
  me: AuthMeUsuarios,
  alvo: { id: string; perfil?: { slug: string } | null }
): boolean {
  if (!canManageUsuariosList(me)) return false;
  if (me.user.id === alvo.id) return false;
  if (me.perfilSlug === "admin_geral") return true;
  const slug = alvo.perfil?.slug ?? "";
  return nivelPerfil(slug) < nivelPerfil(me.perfilSlug);
}

export function canDeleteUsuarioClient(
  me: AuthMeUsuarios,
  alvo: { id: string; perfil?: { slug: string } | null }
): boolean {
  return canEditUsuarioClient(me, alvo);
}
