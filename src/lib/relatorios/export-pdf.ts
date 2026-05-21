import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { RelatorioDataset } from "@/lib/relatorios/queries";

export function exportRelatorioPdf(data: RelatorioDataset): Uint8Array {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const margin = 14;
  let y = margin;

  doc.setFontSize(16);
  doc.setTextColor(30, 41, 59);
  doc.text("PULSE", margin, y);
  y += 8;

  doc.setFontSize(12);
  doc.text(data.titulo, margin, y);
  y += 7;

  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(`Gerado em: ${data.geradoEm}`, margin, y);
  y += 5;
  doc.text(`Por: ${data.geradoPor}`, margin, y);
  y += 5;
  doc.text(
    `Escopo: ${data.escopo === "todos" ? "Todos os cadastros" : "Meus cadastros"}`,
    margin,
    y
  );
  y += 5;
  if (data.periodo) {
    doc.text(`Período: ${data.periodo.de} a ${data.periodo.ate}`, margin, y);
    y += 5;
  }
  doc.text(`Total de registros: ${data.totalGeral}`, margin, y);
  y += 8;

  const resumoHead = data.resumo[0]?.detalhe
    ? [["Grupo", "Detalhe", "Total"]]
    : [["Grupo", "Total"]];

  const resumoBody = data.resumo.map((r) =>
    r.detalhe ? [r.grupo, r.detalhe, String(r.total)] : [r.grupo, String(r.total)]
  );

  autoTable(doc, {
    startY: y,
    head: resumoHead,
    body: resumoBody,
    theme: "grid",
    headStyles: { fillColor: [59, 130, 246] },
    styles: { fontSize: 8 },
    margin: { left: margin, right: margin },
  });

  y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;

  if (data.detalhes.length > 0) {
    doc.setFontSize(10);
    doc.setTextColor(30, 41, 59);
    doc.text("Detalhamento", margin, y);
    y += 6;

    autoTable(doc, {
      startY: y,
      head: [["Grupo", "Nome", "CPF", "Situação", "Cadastrado em"]],
      body: data.detalhes.map((d) => [
        d.grupo,
        d.nome,
        d.cpf,
        d.situacao,
        d.cadastrado_em,
      ]),
      theme: "striped",
      headStyles: { fillColor: [30, 41, 59] },
      styles: { fontSize: 7 },
      margin: { left: margin, right: margin },
    });
  }

  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(`Página ${i} de ${pages}`, doc.internal.pageSize.getWidth() - margin, 290, {
      align: "right",
    });
  }

  return new Uint8Array(doc.output("arraybuffer"));
}
