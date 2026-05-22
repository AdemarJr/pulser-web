import type { SupabaseClient } from "@supabase/supabase-js";

const ELEITOR_SELECT = `
  *,
  bairro:bairros(nome),
  cidade:cidades(nome, estado:estados(sigla, nome)),
  cidade_cadastro:cidades!cidade_cadastro_id(nome, estado:estados(sigla, nome)),
  zona_eleitoral:zonas_eleitorais(numero),
  cadastrador:usuarios!cadastrado_por(nome_completo)
`;

export async function fetchEleitorById(
  supabase: SupabaseClient,
  id: string,
  opts?: { cadastradoPor?: string }
) {
  let query = supabase
    .from("eleitores")
    .select(ELEITOR_SELECT)
    .eq("id", id)
    .is("deleted_at", null);

  if (opts?.cadastradoPor) {
    query = query.eq("cadastrado_por", opts.cadastradoPor);
  }

  return query.maybeSingle();
}
