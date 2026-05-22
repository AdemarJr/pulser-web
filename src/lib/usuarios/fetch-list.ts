import type { SupabaseClient } from "@supabase/supabase-js";
import {
  isUsuarioCriadorEmbedError,
  USUARIO_LIST_SELECT,
  USUARIO_LIST_SELECT_SEM_CRIADOR,
} from "@/lib/usuarios/select-fields";

export async function fetchUsuariosLista(supabase: SupabaseClient) {
  let result = await supabase
    .from("usuarios")
    .select(USUARIO_LIST_SELECT)
    .order("nome_completo");

  if (
    result.error &&
    isUsuarioCriadorEmbedError(result.error.message)
  ) {
    result = await supabase
      .from("usuarios")
      .select(USUARIO_LIST_SELECT_SEM_CRIADOR)
      .order("nome_completo");
  }

  return result;
}
