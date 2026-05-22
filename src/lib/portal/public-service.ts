import { createServiceClient } from "@/lib/supabase/server";
import type { OpcaoPergunta, PortalFormularioTipo } from "@/lib/portal/types";
import { randomBytes } from "crypto";

function parseOpcoes(raw: unknown): OpcaoPergunta[] {
  if (!Array.isArray(raw)) return [];
  return raw as OpcaoPergunta[];
}

export async function listCampanhasPublicas() {
  const supabase = await createServiceClient();
  const { data, error } = await supabase
    .from("campanhas")
    .select("id, slug, titulo, descricao, status, imagem_url, publicado_em")
    .eq("status", "publicado")
    .order("publicado_em", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getCampanhaPublica(slug: string) {
  const supabase = await createServiceClient();
  const { data: campanha, error } = await supabase
    .from("campanhas")
    .select("id, slug, titulo, descricao, status, imagem_url, publicado_em")
    .eq("slug", slug)
    .eq("status", "publicado")
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!campanha) return null;

  const { data: formularios } = await supabase
    .from("formularios")
    .select("id, slug, tipo, titulo, descricao, ordem, config, publicado_em")
    .eq("campanha_id", campanha.id)
    .eq("status", "publicado")
    .order("ordem");

  return { ...campanha, formularios: formularios ?? [] };
}

export async function getFormularioPublico(campanhaSlug: string, formularioSlug: string) {
  const supabase = await createServiceClient();

  const { data: campanha } = await supabase
    .from("campanhas")
    .select("id, slug, titulo")
    .eq("slug", campanhaSlug)
    .eq("status", "publicado")
    .maybeSingle();

  if (!campanha) return null;

  const { data: formulario, error } = await supabase
    .from("formularios")
    .select("id, campanha_id, slug, tipo, titulo, descricao, config, status")
    .eq("campanha_id", campanha.id)
    .eq("slug", formularioSlug)
    .eq("status", "publicado")
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!formulario) return null;

  const { data: perguntas } = await supabase
    .from("perguntas")
    .select("id, ordem, texto, tipo, opcoes, obrigatoria, config")
    .eq("formulario_id", formulario.id)
    .order("ordem");

  return {
    campanha,
    formulario: {
      ...formulario,
      tipo: formulario.tipo as PortalFormularioTipo,
      config: (formulario.config ?? {}) as Record<string, unknown>,
    },
    perguntas: (perguntas ?? []).map((p) => ({
      ...p,
      opcoes: parseOpcoes(p.opcoes),
      config: (p.config ?? {}) as Record<string, unknown>,
    })),
  };
}

export function gerarTokenParticipacao(): string {
  return randomBytes(32).toString("hex");
}

export async function iniciarParticipacao(formularioId: string, ipHash?: string) {
  const supabase = await createServiceClient();
  const token = gerarTokenParticipacao();

  const { data, error } = await supabase
    .from("participacoes")
    .insert({
      formulario_id: formularioId,
      token,
      ip_hash: ipHash ?? null,
      consentimento_versao: "v1",
    })
    .select("id, token")
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export function calcularPontuacaoQuiz(
  perguntas: { id: string; opcoes: OpcaoPergunta[] }[],
  respostas: { pergunta_id: string; valor: unknown }[]
): number {
  let pontos = 0;
  for (const r of respostas) {
    const p = perguntas.find((x) => x.id === r.pergunta_id);
    if (!p) continue;
    const valor = String(r.valor);
    const opcao = p.opcoes.find((o) => o.id === valor);
    if (opcao?.correta) pontos += opcao.pontos ?? 1;
  }
  return pontos;
}

export async function concluirParticipacao(
  token: string,
  respostas: { pergunta_id: string; valor: unknown }[],
  metadata?: Record<string, unknown>
) {
  const supabase = await createServiceClient();

  const { data: participacao, error: partErr } = await supabase
    .from("participacoes")
    .select("id, formulario_id, status")
    .eq("token", token)
    .maybeSingle();

  if (partErr) throw new Error(partErr.message);
  if (!participacao) throw new Error("Participação não encontrada");
  if (participacao.status === "concluida") {
    throw new Error("Esta participação já foi enviada");
  }

  const { data: formulario } = await supabase
    .from("formularios")
    .select("id, tipo, status")
    .eq("id", participacao.formulario_id)
    .eq("status", "publicado")
    .maybeSingle();

  if (!formulario) throw new Error("Formulário indisponível");

  const { data: perguntas } = await supabase
    .from("perguntas")
    .select("id, opcoes, obrigatoria, config, tipo")
    .eq("formulario_id", formulario.id);

  const lista = perguntas ?? [];
  const obrigatorias = lista.filter((p) => p.obrigatoria);
  for (const ob of obrigatorias) {
    const resp = respostas.find((r) => r.pergunta_id === ob.id);
    if (!resp || resp.valor === "" || (Array.isArray(resp.valor) && resp.valor.length === 0)) {
      throw new Error("Responda todas as perguntas obrigatórias");
    }
  }

  for (const p of lista) {
    if (p.tipo === "multi") {
      const cfg = (p.config ?? {}) as { max_selecoes?: number };
      const resp = respostas.find((r) => r.pergunta_id === p.id);
      if (resp && Array.isArray(resp.valor) && cfg.max_selecoes) {
        if (resp.valor.length > cfg.max_selecoes) {
          throw new Error(`Selecione no máximo ${cfg.max_selecoes} opções`);
        }
      }
    }
  }

  const rows = respostas.map((r) => ({
    participacao_id: participacao.id,
    pergunta_id: r.pergunta_id,
    valor: r.valor,
  }));

  const { error: respErr } = await supabase.from("respostas").insert(rows);
  if (respErr) throw new Error(respErr.message);

  let pontuacao: number | null = null;
  if (formulario.tipo === "quiz") {
    pontuacao = calcularPontuacaoQuiz(
      lista.map((p) => ({ id: p.id, opcoes: parseOpcoes(p.opcoes) })),
      respostas
    );
  }

  const { error: updErr } = await supabase
    .from("participacoes")
    .update({
      status: "concluida",
      completed_at: new Date().toISOString(),
      metadata: metadata ?? {},
      pontuacao,
    })
    .eq("id", participacao.id);

  if (updErr) throw new Error(updErr.message);

  return { pontuacao, tipo: formulario.tipo };
}

export async function getResultadosPublicos(formularioId: string) {
  const supabase = await createServiceClient();

  const { count: totalParticipacoes } = await supabase
    .from("participacoes")
    .select("*", { count: "exact", head: true })
    .eq("formulario_id", formularioId)
    .eq("status", "concluida");

  const { data: agregados, error } = await supabase
    .from("vw_portal_resultados_opcao")
    .select("pergunta_id, pergunta_texto, opcao_id, opcao_label, total_votos")
    .eq("formulario_id", formularioId);

  if (error) throw new Error(error.message);

  const porPergunta = new Map<
    string,
    { texto: string; opcoes: { id: string; label: string; total: number }[] }
  >();

  for (const row of agregados ?? []) {
    const key = row.pergunta_id as string;
    if (!porPergunta.has(key)) {
      porPergunta.set(key, {
        texto: row.pergunta_texto as string,
        opcoes: [],
      });
    }
    porPergunta.get(key)!.opcoes.push({
      id: row.opcao_id as string,
      label: row.opcao_label as string,
      total: Number(row.total_votos) || 0,
    });
  }

  return {
    total_participacoes: totalParticipacoes ?? 0,
    perguntas: Array.from(porPergunta.entries()).map(([id, v]) => ({
      pergunta_id: id,
      ...v,
    })),
  };
}
