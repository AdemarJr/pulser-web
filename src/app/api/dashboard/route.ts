import { createClient } from "@/lib/supabase/server";
import { requireSession } from "@/lib/auth/session";
import { canViewAllEleitores } from "@/lib/auth/eleitores-access";
import { PERMISSIONS, hasPermission } from "@/lib/auth/permissions";
import { jsonForbidden, jsonOk, jsonUnauthorized } from "@/lib/api/response";

export async function GET() {
  try {
    const session = await requireSession();
    if (!hasPermission(session.permissions, PERMISSIONS.DASHBOARD_VISUALIZAR)) {
      return jsonForbidden();
    }

    const supabase = await createClient();
    const verTodos = canViewAllEleitores(session);

    let eleitoresQuery = supabase
      .from("eleitores")
      .select("id, created_at, bairro_id, cadastrado_por, bairro:bairros(nome)")
      .is("deleted_at", null);

    if (!verTodos) {
      eleitoresQuery = eleitoresQuery.eq("cadastrado_por", session.user.id);
    }

    const { data: eleitores } = await eleitoresQuery;

    const inicioMes = new Date();
    inicioMes.setDate(1);
    inicioMes.setHours(0, 0, 0, 0);

    const total_eleitores = eleitores?.length ?? 0;
    const cadastros_mes =
      eleitores?.filter((e) => new Date(e.created_at) >= inicioMes).length ?? 0;

    const mapBairro = new Map<string, { nome: string; total: number }>();
    eleitores?.forEach((e) => {
      const b = e.bairro as { nome: string } | { nome: string }[] | null;
      const nome = (Array.isArray(b) ? b[0]?.nome : b?.nome) ?? "Sem bairro";
      const cur = mapBairro.get(nome) ?? { nome, total: 0 };
      cur.total++;
      mapBairro.set(nome, cur);
    });
    const porBairro = Array.from(mapBairro.values())
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);

    let rankingCadastradores: { nome: string; total: number }[] = [];
    if (verTodos) {
      const { data: cadastradores } = await supabase
        .from("eleitores")
        .select("cadastrado_por, usuario:usuarios(nome_completo)")
        .is("deleted_at", null);

      const rankMap = new Map<string, { nome: string; total: number }>();
      cadastradores?.forEach((c) => {
        const u = c.usuario as { nome_completo: string } | { nome_completo: string }[] | null;
        const nome =
          (Array.isArray(u) ? u[0]?.nome_completo : u?.nome_completo) ?? "Desconhecido";
        const key = c.cadastrado_por ?? "none";
        const cur = rankMap.get(key) ?? { nome, total: 0 };
        cur.total++;
        rankMap.set(key, cur);
      });
      rankingCadastradores = Array.from(rankMap.values())
        .sort((a, b) => b.total - a.total)
        .slice(0, 5);
    } else {
      rankingCadastradores = [
        {
          nome: session.profile.nome_completo,
          total: total_eleitores,
        },
      ];
    }

    const { count: usuarios_ativos } = await supabase
      .from("usuarios")
      .select("*", { count: "exact", head: true })
      .eq("status", "ativo");

    return jsonOk({
      stats: {
        total_eleitores,
        cadastros_mes,
        usuarios_ativos: usuarios_ativos ?? 0,
      },
      porBairro,
      rankingCadastradores,
      escopo: verTodos ? "todos" : "proprios",
    });
  } catch {
    return jsonUnauthorized();
  }
}
