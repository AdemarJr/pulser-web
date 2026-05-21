import type { ReportFormato } from "@/lib/relatorios/config";
import type { RelatorioDataset } from "@/lib/relatorios/queries";
import { exportRelatorioCsv } from "@/lib/relatorios/export-csv";
import { exportRelatorioPdf } from "@/lib/relatorios/export-pdf";
import { exportRelatorioXlsx } from "@/lib/relatorios/export-xlsx";

export type ExportResult = {
  body: Uint8Array | Buffer | string;
  contentType: string;
  extension: string;
};

export function exportRelatorio(
  data: RelatorioDataset,
  formato: ReportFormato
): ExportResult {
  switch (formato) {
    case "pdf":
      return {
        body: exportRelatorioPdf(data),
        contentType: "application/pdf",
        extension: "pdf",
      };
    case "xlsx":
      return {
        body: exportRelatorioXlsx(data),
        contentType:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        extension: "xlsx",
      };
    case "csv":
      return {
        body: exportRelatorioCsv(data),
        contentType: "text/csv; charset=utf-8",
        extension: "csv",
      };
    default:
      throw new Error("Formato não suportado");
  }
}

export function slugArquivo(tipo: string): string {
  const d = new Date().toISOString().slice(0, 10);
  return `relatorio-${tipo}-${d}`;
}
