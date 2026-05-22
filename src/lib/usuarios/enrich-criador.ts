import type { SupabaseClient } from "@supabase/supabase-js";

export async function enrichUsuarioCriador<T extends { criado_por?: string | null }>(
  supabase: SupabaseClient,
  row: T
): Promise<T & { criador: { nome_completo: string } | null }> {
  if (!row.criado_por) {
    return { ...row, criador: null };
  }
  const { data: criador } = await supabase
    .from("usuarios")
    .select("nome_completo")
    .eq("id", row.criado_por)
    .maybeSingle();

  return {
    ...row,
    criador: criador?.nome_completo
      ? { nome_completo: criador.nome_completo as string }
      : null,
  };
}
