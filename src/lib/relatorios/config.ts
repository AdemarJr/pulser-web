export const REPORT_TIPOS = [
  "zona-eleitoral",
  "bairro",
  "cidade",
  "cadastros-usuario",
  "cadastros-periodo",
] as const;

export type ReportTipo = (typeof REPORT_TIPOS)[number];

export const REPORT_FORMATOS = ["pdf", "xlsx", "csv"] as const;
export type ReportFormato = (typeof REPORT_FORMATOS)[number];

export const REPORT_META: Record<
  ReportTipo,
  { titulo: string; descricao: string; requerPeriodo?: boolean }
> = {
  "zona-eleitoral": {
    titulo: "Eleitores por zona eleitoral",
    descricao: "Total de eleitores agrupados por zona, cidade e estado.",
  },
  bairro: {
    titulo: "Eleitores por bairro",
    descricao: "Total de eleitores agrupados por bairro e município.",
  },
  cidade: {
    titulo: "Eleitores por cidade",
    descricao: "Total de eleitores agrupados por município e UF.",
  },
  "cadastros-usuario": {
    titulo: "Cadastros por usuário",
    descricao: "Quantidade de cadastros realizados por cada usuário.",
  },
  "cadastros-periodo": {
    titulo: "Cadastros por período",
    descricao: "Cadastros agrupados por dia no intervalo informado.",
    requerPeriodo: true,
  },
};

export function isReportTipo(value: string): value is ReportTipo {
  return (REPORT_TIPOS as readonly string[]).includes(value);
}

export function isReportFormato(value: string): value is ReportFormato {
  return (REPORT_FORMATOS as readonly string[]).includes(value);
}
