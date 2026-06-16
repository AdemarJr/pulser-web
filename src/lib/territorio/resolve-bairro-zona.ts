import type { SupabaseClient } from "@supabase/supabase-js";

export async function resolveBairroId(
  supabase: SupabaseClient,
  cidadeId: string,
  bairroId?: string,
  novoNome?: string
): Promise<string> {
  if (bairroId) return bairroId;

  const nome = novoNome?.trim();
  if (!nome) throw new Error("Informe ou selecione o bairro");

  const { data: existing } = await supabase
    .from("bairros")
    .select("id")
    .eq("cidade_id", cidadeId)
    .ilike("nome", nome)
    .maybeSingle();

  if (existing) return existing.id;

  const { data: created, error } = await supabase
    .from("bairros")
    .insert({ nome, cidade_id: cidadeId })
    .select("id")
    .single();

  if (error) throw new Error(error.message);
  return created.id;
}

export async function resolveZonaId(
  supabase: SupabaseClient,
  cidadeId: string,
  estadoId: string,
  zonaId?: string,
  novoNumero?: number
): Promise<string> {
  if (zonaId) return zonaId;

  if (!novoNumero || novoNumero < 1) {
    throw new Error("Informe ou selecione a zona eleitoral");
  }

  const { data: existing } = await supabase
    .from("zonas_eleitorais")
    .select("id")
    .eq("cidade_id", cidadeId)
    .eq("numero", novoNumero)
    .maybeSingle();

  if (existing) return existing.id;

  const { data: created, error } = await supabase
    .from("zonas_eleitorais")
    .insert({
      numero: novoNumero,
      cidade_id: cidadeId,
      estado_id: estadoId,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);
  return created.id;
}

/** Retorna null quando zona não foi informada (cadastro sem carteira de eleitor). */
export async function resolveZonaIdOpcional(
  supabase: SupabaseClient,
  cidadeId: string,
  estadoId: string,
  zonaId?: string,
  novoNumero?: number
): Promise<string | null> {
  if (zonaId) return zonaId;
  if (!novoNumero || novoNumero < 1) return null;
  return resolveZonaId(supabase, cidadeId, estadoId, undefined, novoNumero);
}
