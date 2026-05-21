import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth/session";
import { PERMISSIONS, hasPermission } from "@/lib/auth/permissions";
import { jsonError, jsonForbidden, jsonUnauthorized } from "@/lib/api/response";
import {
  isReportFormato,
  isReportTipo,
  REPORT_META,
} from "@/lib/relatorios/config";
import { buildRelatorioDataset } from "@/lib/relatorios/queries";
import { exportRelatorio, slugArquivo } from "@/lib/relatorios/export";

type RouteContext = { params: Promise<{ tipo: string }> };

export async function GET(request: Request, context: RouteContext) {
  try {
    const session = await requireSession();

    if (
      !hasPermission(session.permissions, PERMISSIONS.RELATORIOS_EXPORTAR) &&
      !hasPermission(session.permissions, PERMISSIONS.RELATORIOS_VISUALIZAR)
    ) {
      return jsonForbidden();
    }

    const { tipo } = await context.params;
    if (!isReportTipo(tipo)) {
      return jsonError(
        `Tipo de relatório inválido. Use: ${Object.keys(REPORT_META).join(", ")}`,
        400
      );
    }

    const { searchParams } = new URL(request.url);
    const formatParam = (searchParams.get("format") ?? "pdf").toLowerCase();

    if (!isReportFormato(formatParam)) {
      return jsonError("Formato inválido. Use: pdf, xlsx ou csv.", 400);
    }

    const de = searchParams.get("de") ?? undefined;
    const ate = searchParams.get("ate") ?? undefined;

    if (REPORT_META[tipo].requerPeriodo && (!de || !ate)) {
      return jsonError(
        "Informe os parâmetros de e ate (YYYY-MM-DD) para este relatório.",
        400
      );
    }

    let dataset;
    try {
      dataset = await buildRelatorioDataset(session, tipo, { de, ate });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao gerar relatório";
      return jsonError(msg, 400);
    }

    const { body, contentType, extension } = exportRelatorio(dataset, formatParam);
    const filename = `${slugArquivo(tipo)}.${extension}`;

    return new NextResponse(body as BodyInit, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return jsonUnauthorized();
  }
}
