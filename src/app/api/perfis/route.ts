import { createClient } from "@/lib/supabase/server";
import { requireSession } from "@/lib/auth/session";
import { perfisAtribuiveis } from "@/lib/auth/perfil-hierarquia";
import { canViewUsuarios } from "@/lib/auth/usuarios-access";
import { jsonForbidden, jsonOk, jsonUnauthorized } from "@/lib/api/response";

export async function GET() {
  try {
    const session = await requireSession();
    if (!canViewUsuarios(session)) return jsonForbidden();

    const supabase = await createClient();
    const slugAtor = session.profile.perfil?.slug ?? "";

    const { data: perfis, error: errPerfis } = await supabase
      .from("perfis")
      .select("id, slug, nome, descricao, is_system")
      .order("nome");

    if (errPerfis) return jsonOk([]);

    const atribuiveis = new Set(perfisAtribuiveis(slugAtor));
    const podeGerenciar = session.profile.perfil?.slug === "admin_geral";

    const { data: vinculos } = await supabase.from("perfil_permissoes").select(
      "perfil_id, permissao:permissoes(id, slug, nome, modulo)"
    );

    const permissoesPorPerfil = new Map<
      string,
      { id: string; slug: string; nome: string; modulo: string }[]
    >();

    vinculos?.forEach((v) => {
      const perm = v.permissao as
        | { id: string; slug: string; nome: string; modulo: string }
        | { id: string; slug: string; nome: string; modulo: string }[];
      const item = Array.isArray(perm) ? perm[0] : perm;
      if (!item) return;
      const list = permissoesPorPerfil.get(v.perfil_id) ?? [];
      list.push(item);
      permissoesPorPerfil.set(v.perfil_id, list);
    });

    const resultado = (perfis ?? []).map((p) => ({
      ...p,
      permissoes: permissoesPorPerfil.get(p.id) ?? [],
      pode_atribuir: podeGerenciar || atribuiveis.has(p.slug as never),
    }));

    return jsonOk({
      perfis: resultado,
      hierarquia: ["admin_geral", "coordenador", "cadastrador", "visualizador"],
      perfil_atual: slugAtor,
    });
  } catch {
    return jsonUnauthorized();
  }
}
