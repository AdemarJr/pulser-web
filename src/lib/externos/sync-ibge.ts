import type { SupabaseClient } from "@supabase/supabase-js";
import { getIbgeEstados, getIbgeMunicipiosPorUf } from "@/lib/externos/ibge";

/** Sincroniza apenas estados (UF) e municípios para uso nos cadastros. */
export interface SyncIbgeOptions {
  ufs?: string[];
}

export interface SyncIbgeResult {
  estados: { inseridos: number; atualizados: number };
  municipios: { inseridos: number; atualizados: number };
  ufs_processadas: string[];
}

async function upsertEstado(
  supabase: SupabaseClient,
  estado: { ibge_id: number; sigla: string; nome: string }
) {
  const { data: existing } = await supabase
    .from("estados")
    .select("id")
    .eq("sigla", estado.sigla)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("estados")
      .update({ nome: estado.nome, ibge_id: estado.ibge_id })
      .eq("id", existing.id);
    return "atualizado" as const;
  }

  const { error } = await supabase.from("estados").insert({
    nome: estado.nome,
    sigla: estado.sigla,
    ibge_id: estado.ibge_id,
  });
  if (error) throw error;
  return "inserido" as const;
}

async function upsertMunicipio(
  supabase: SupabaseClient,
  municipio: { ibge_id: number; nome: string },
  estadoId: string
) {
  const { data: byIbge } = await supabase
    .from("cidades")
    .select("id")
    .eq("ibge_id", municipio.ibge_id)
    .maybeSingle();

  if (byIbge) {
    await supabase
      .from("cidades")
      .update({ nome: municipio.nome, estado_id: estadoId })
      .eq("id", byIbge.id);
    return "atualizado" as const;
  }

  const { data: byNome } = await supabase
    .from("cidades")
    .select("id")
    .eq("estado_id", estadoId)
    .eq("nome", municipio.nome)
    .maybeSingle();

  if (byNome) {
    await supabase
      .from("cidades")
      .update({ ibge_id: municipio.ibge_id })
      .eq("id", byNome.id);
    return "atualizado" as const;
  }

  const { error } = await supabase.from("cidades").insert({
    nome: municipio.nome,
    estado_id: estadoId,
    ibge_id: municipio.ibge_id,
  });
  if (error) throw error;
  return "inserido" as const;
}

export async function syncEstadosEMunicipiosFromIbge(
  supabase: SupabaseClient,
  options: SyncIbgeOptions = {}
): Promise<SyncIbgeResult> {
  const result: SyncIbgeResult = {
    estados: { inseridos: 0, atualizados: 0 },
    municipios: { inseridos: 0, atualizados: 0 },
    ufs_processadas: [],
  };

  const estadosIbge = await getIbgeEstados();
  const ufsFiltro = options.ufs?.map((u) => u.toUpperCase());
  const estadosAlvo = ufsFiltro?.length
    ? estadosIbge.filter((e) => ufsFiltro.includes(e.sigla))
    : estadosIbge;

  const estadoIdBySigla = new Map<string, string>();

  for (const estado of estadosAlvo) {
    const acao = await upsertEstado(supabase, estado);
    if (acao === "inserido") result.estados.inseridos++;
    else result.estados.atualizados++;

    const { data: row } = await supabase
      .from("estados")
      .select("id")
      .eq("sigla", estado.sigla)
      .single();
    if (row) estadoIdBySigla.set(estado.sigla, row.id);
  }

  for (const estado of estadosAlvo) {
    const estadoId = estadoIdBySigla.get(estado.sigla);
    if (!estadoId) continue;

    result.ufs_processadas.push(estado.sigla);
    const municipios = await getIbgeMunicipiosPorUf(estado.sigla);

    for (const municipio of municipios) {
      const acao = await upsertMunicipio(supabase, municipio, estadoId);
      if (acao === "inserido") result.municipios.inseridos++;
      else result.municipios.atualizados++;
    }
  }

  return result;
}
