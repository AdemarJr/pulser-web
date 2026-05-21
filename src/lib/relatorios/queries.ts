import { createClient } from "@/lib/supabase/server";
import type { AuthSession } from "@/lib/auth/session";
import { canViewAllEleitores } from "@/lib/auth/eleitores-access";
import type { ReportTipo } from "@/lib/relatorios/config";
import { formatCPF } from "@/lib/utils";

export type ResumoRow = {
  grupo: string;
  detalhe?: string;
  total: number;
};

export type DetalheRow = {
  grupo: string;
  nome: string;
  cpf: string;
  situacao: string;
  cadastrado_em: string;
};

export type RelatorioDataset = {
  titulo: string;
  geradoEm: string;
  geradoPor: string;
  escopo: "todos" | "proprios";
  periodo?: { de: string; ate: string };
  resumo: ResumoRow[];
  detalhes: DetalheRow[];
  totalGeral: number;
};

type EleitorRow = {
  id: string;
  nome_completo: string;
  cpf: string;
  situacao: string;
  created_at: string;
  cadastrado_por: string | null;
  bairro: { nome: string } | { nome: string }[] | null;
  cidade: { nome: string } | { nome: string }[] | null;
  estado: { sigla: string; nome: string } | { sigla: string; nome: string }[] | null;
  zona_eleitoral: { numero: number } | { numero: number }[] | null;
  usuario: { nome_completo: string } | { nome_completo: string }[] | null;
};

function relName<T extends { nome?: string; sigla?: string; numero?: number }>(
  rel: T | T[] | null | undefined,
  field: "nome" | "sigla" | "numero" = "nome"
): string {
  if (!rel) return "—";
  const item = Array.isArray(rel) ? rel[0] : rel;
  if (!item) return "—";
  if (field === "sigla") return item.sigla ?? "—";
  if (field === "numero") return String(item.numero ?? "—");
  return item.nome ?? "—";
}

function usuarioNome(
  rel: { nome_completo: string } | { nome_completo: string }[] | null | undefined
): string {
  if (!rel) return "Sem cadastrador";
  const item = Array.isArray(rel) ? rel[0] : rel;
  return item?.nome_completo ?? "Sem cadastrador";
}

function formatDateBr(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR");
}

function formatDateTimeBr(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR");
}

function grupoLabel(tipo: ReportTipo, e: EleitorRow): string {
  switch (tipo) {
    case "zona-eleitoral": {
      const zona = relName(e.zona_eleitoral, "numero");
      const cidade = relName(e.cidade);
      const uf = relName(e.estado, "sigla");
      return `Zona ${zona} — ${cidade}/${uf}`;
    }
    case "bairro": {
      const bairro = relName(e.bairro);
      const cidade = relName(e.cidade);
      return `${bairro} — ${cidade}`;
    }
    case "cidade": {
      const cidade = relName(e.cidade);
      const uf = relName(e.estado, "sigla");
      return `${cidade}/${uf}`;
    }
    case "cadastros-usuario":
      return usuarioNome(e.usuario);
    case "cadastros-periodo":
      return formatDateBr(e.created_at);
    default:
      return "—";
  }
}

function resumoDetalhe(tipo: ReportTipo, e: EleitorRow): string | undefined {
  if (tipo === "zona-eleitoral") return relName(e.cidade);
  if (tipo === "bairro") return relName(e.cidade);
  if (tipo === "cidade") return relName(e.estado);
  if (tipo === "cadastros-usuario") return e.cadastrado_por ? undefined : "Sem vínculo";
  return undefined;
}

export async function buildRelatorioDataset(
  session: AuthSession,
  tipo: ReportTipo,
  opts?: { de?: string; ate?: string }
): Promise<RelatorioDataset> {
  const supabase = await createClient();
  const verTodos = canViewAllEleitores(session);

  let query = supabase
    .from("eleitores")
    .select(
      `id, nome_completo, cpf, situacao, created_at, cadastrado_por,
       bairro:bairros(nome),
       cidade:cidades(nome),
       estado:estados(sigla, nome),
       zona_eleitoral:zonas_eleitorais(numero),
       usuario:usuarios(nome_completo)`
    )
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (!verTodos) {
    query = query.eq("cadastrado_por", session.user.id);
  }

  let periodo: { de: string; ate: string } | undefined;

  if (tipo === "cadastros-periodo") {
    const de = opts?.de;
    const ate = opts?.ate;
    if (!de || !ate) {
      throw new Error("Informe as datas de início e fim (de e ate).");
    }
    const inicio = new Date(de);
    const fim = new Date(ate);
    if (Number.isNaN(inicio.getTime()) || Number.isNaN(fim.getTime())) {
      throw new Error("Datas inválidas.");
    }
    fim.setHours(23, 59, 59, 999);
    if (inicio > fim) {
      throw new Error("A data inicial deve ser anterior à data final.");
    }
    periodo = { de, ate };
    query = query
      .gte("created_at", inicio.toISOString())
      .lte("created_at", fim.toISOString());
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  const eleitores = (data ?? []) as EleitorRow[];
  const mapResumo = new Map<string, ResumoRow>();

  for (const e of eleitores) {
    const grupo = grupoLabel(tipo, e);
    const cur = mapResumo.get(grupo) ?? {
      grupo,
      detalhe: resumoDetalhe(tipo, e),
      total: 0,
    };
    cur.total++;
    mapResumo.set(grupo, cur);
  }

  const resumo = Array.from(mapResumo.values()).sort((a, b) => b.total - a.total);

  const detalhes: DetalheRow[] = eleitores.map((e) => ({
    grupo: grupoLabel(tipo, e),
    nome: e.nome_completo,
    cpf: formatCPF(e.cpf),
    situacao: e.situacao,
    cadastrado_em: formatDateTimeBr(e.created_at),
  }));

  const titulos: Record<ReportTipo, string> = {
    "zona-eleitoral": "Eleitores por zona eleitoral",
    bairro: "Eleitores por bairro",
    cidade: "Eleitores por cidade",
    "cadastros-usuario": "Cadastros por usuário",
    "cadastros-periodo": "Cadastros por período",
  };

  return {
    titulo: titulos[tipo],
    geradoEm: formatDateTimeBr(new Date().toISOString()),
    geradoPor: session.profile.nome_completo,
    escopo: verTodos ? "todos" : "proprios",
    periodo,
    resumo,
    detalhes,
    totalGeral: eleitores.length,
  };
}
