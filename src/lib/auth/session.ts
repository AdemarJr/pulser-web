import { createClient } from "@/lib/supabase/server";
import type { Perfil, Usuario } from "@/types/database";

export interface AuthSession {
  user: { id: string; email: string };
  profile: Usuario & { perfil: Perfil };
  permissions: string[];
}

export async function getSession(): Promise<AuthSession | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("usuarios")
    .select("*, perfil:perfis(*)")
    .eq("id", user.id)
    .single();

  if (!profile || profile.status !== "ativo") return null;

  const { data: perms } = await supabase
    .from("perfil_permissoes")
    .select("permissao:permissoes(slug)")
    .eq("perfil_id", profile.perfil_id);

  const permissions =
    perms?.map((p) => {
      const perm = p.permissao as { slug: string } | { slug: string }[];
      return Array.isArray(perm) ? perm[0]?.slug : perm?.slug;
    }).filter(Boolean) as string[] ?? [];

  return {
    user: { id: user.id, email: user.email ?? "" },
    profile: profile as Usuario & { perfil: Perfil },
    permissions,
  };
}

export async function requireSession(): Promise<AuthSession> {
  const session = await getSession();
  if (!session) {
    throw new Error("UNAUTHORIZED");
  }
  return session;
}
