import * as XLSX from "xlsx";
import type { RelatorioDataset } from "@/lib/relatorios/queries";

export function exportRelatorioCsv(data: RelatorioDataset): string {
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
  rows.push(["Total", data.totalGeral], []);

  const resumoHeader = data.resumo.some((r) => r.detalhe)
    ? ["Grupo", "Detalhe", "Total"]
    : ["Grupo", "Total"];
  rows.push(resumoHeader);
  data.resumo.forEach((r) => {
    rows.push(r.detalhe ? [r.grupo, r.detalhe, r.total] : [r.grupo, r.total]);
  });

  rows.push([]);
  rows.push(["Grupo", "Nome", "CPF", "Situação", "Cadastrado em"]);
  data.detalhes.forEach((d) => {
    rows.push([d.grupo, d.nome, d.cpf, d.situacao, d.cadastrado_em]);
  });

  const ws = XLSX.utils.aoa_to_sheet(rows);
  return XLSX.utils.sheet_to_csv(ws, { FS: ";" });
}
