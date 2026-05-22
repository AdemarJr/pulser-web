import type { SupabaseClient } from "@supabase/supabase-js";
import { USUARIO_LIST_SELECT } from "@/lib/usuarios/select-fields";

export type UsuarioListaRow = Record<string, unknown> & {
  id: string;
  criado_por?: string | null;
  criador?: { nome_completo: string } | null;
};

export async function fetchUsuariosLista(supabase: SupabaseClient) {
  const result = await supabase
    .from("usuarios")
    .select(USUARIO_LIST_SELECT)
    .order("nome_completo");

  if (result.error || !result.data?.length) {
    return result;
  }

  const criadorIds = [
    ...new Set(
      result.data
        .map((u) => u.criado_por as string | null | undefined)
        .filter((id): id is string => Boolean(id))
    ),
  ];

  if (criadorIds.length === 0) {
    return result;
  }

  const { data: criadores } = await supabase
    .from("usuarios")
    .select("id, nome_completo")
    .in("id", criadorIds);

  const porId = new Map(
    (criadores ?? []).map((c) => [c.id, c.nome_completo as string])
  );

  const enriched = result.data.map((row) => {
    const criadoPor = row.criado_por as string | null | undefined;
    const nome = criadoPor ? porId.get(criadoPor) : undefined;
    return {
      ...row,
      criador: nome ? { nome_completo: nome } : null,
    };
  });

  return { ...result, data: enriched };
}
