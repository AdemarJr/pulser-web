import * as XLSX from "xlsx";
import type { RelatorioDataset } from "@/lib/relatorios/queries";

function metaRows(data: RelatorioDataset): (string | number)[][] {
  const rows: (string | number)[][] = [
    ["PULSE — Gestão de Eleitores"],
    [data.titulo],
    ["Gerado em", data.geradoEm],
    ["Gerado por", data.geradoPor],
    [
      "Escopo",
      data.escopo === "todos" ? "Todos os cadastros" : "Meus cadastros",
    ],
  ];
  if (data.periodo) {
    rows.push(["Período", `${data.periodo.de} a ${data.periodo.ate}`]);
  }
  rows.push(["Total de registros", data.totalGeral], []);
  return rows;
}

export function exportRelatorioXlsx(data: RelatorioDataset): Buffer {
  const wb = XLSX.utils.book_new();

  const resumoHeader = data.resumo.some((r) => r.detalhe)
    ? ["Grupo", "Detalhe", "Total"]
    : ["Grupo", "Total"];

  const resumoRows = data.resumo.map((r) =>
    r.detalhe ? [r.grupo, r.detalhe, r.total] : [r.grupo, r.total]
  );

  const wsResumo = XLSX.utils.aoa_to_sheet([
    ...metaRows(data),
    ["Resumo"],
    resumoHeader,
    ...resumoRows,
  ]);
  XLSX.utils.book_append_sheet(wb, wsResumo, "Resumo");

  if (data.detalhes.length > 0) {
    const wsDetalhe = XLSX.utils.aoa_to_sheet([
      ["Grupo", "Nome", "CPF", "Situação", "Cadastrado em"],
      ...data.detalhes.map((d) => [
        d.grupo,
        d.nome,
        d.cpf,
        d.situacao,
        d.cadastrado_em,
      ]),
    ]);
    XLSX.utils.book_append_sheet(wb, wsDetalhe, "Detalhes");
  }

  return XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;
}
