import type { SupabaseClient } from "@supabase/supabase-js";
import {
  ELEITOR_DETAIL_SELECT,
  ELEITOR_DETAIL_SELECT_SEM_CADASTRO,
  isCidadeCadastroSchemaError,
} from "@/lib/eleitores/select-fields";

export async function fetchEleitorById(
  supabase: SupabaseClient,
  id: string,
  opts?: { cadastradoPor?: string }
) {
  let query = supabase
    .from("eleitores")
    .select(ELEITOR_DETAIL_SELECT)
    .eq("id", id)
    .is("deleted_at", null);

  if (opts?.cadastradoPor) {
    query = query.eq("cadastrado_por", opts.cadastradoPor);
  }

  let result = await query.maybeSingle();

  if (result.error && isCidadeCadastroSchemaError(result.error.message)) {
    let fallback = supabase
      .from("eleitores")
      .select(ELEITOR_DETAIL_SELECT_SEM_CADASTRO)
      .eq("id", id)
      .is("deleted_at", null);

    if (opts?.cadastradoPor) {
      fallback = fallback.eq("cadastrado_por", opts.cadastradoPor);
    }
    result = await fallback.maybeSingle();
  }

  return result;
}
