"use client";

import { useState } from "react";
import { Download, FileSpreadsheet, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ReportFormato, ReportTipo } from "@/lib/relatorios/config";

type Props = {
  tipo: ReportTipo;
  titulo: string;
  descricao: string;
  requerPeriodo?: boolean;
};

function primeiroDiaMes(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

function hojeIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function RelatorioCard({ tipo, titulo, descricao, requerPeriodo }: Props) {
  const [de, setDe] = useState(primeiroDiaMes());
  const [ate, setAte] = useState(hojeIso());
  const [loading, setLoading] = useState<ReportFormato | null>(null);
  const [error, setError] = useState("");

  async function exportar(formato: ReportFormato) {
    setError("");
    setLoading(formato);

    const params = new URLSearchParams({ format: formato });
    if (requerPeriodo) {
      if (!de || !ate) {
        setError("Informe o período (data inicial e final).");
        setLoading(null);
        return;
      }
      params.set("de", de);
      params.set("ate", ate);
    }

    try {
      const res = await fetch(`/api/relatorios/${tipo}?${params}`, {
        credentials: "include",
      });

      if (!res.ok) {
        const json = await res.json().catch(() => null);
        setError(json?.error ?? "Falha ao gerar relatório.");
        setLoading(null);
        return;
      }

      const blob = await res.blob();
      const disposition = res.headers.get("Content-Disposition");
      const match = disposition?.match(/filename="?([^"]+)"?/);
      const filename =
        match?.[1] ?? `relatorio-${tipo}-${hojeIso()}.${formato === "xlsx" ? "xlsx" : formato}`;

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError("Erro de conexão ao exportar.");
    } finally {
      setLoading(null);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{titulo}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted">{descricao}</p>

        {requerPeriodo && (
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted">
                Data inicial
              </label>
              <Input type="date" value={de} onChange={(e) => setDe(e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-muted">
                Data final
              </label>
              <Input type="date" value={ate} onChange={(e) => setAte(e.target.value)} />
            </div>
          </div>
        )}

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-950/40 dark:text-red-400">
            {error}
          </p>
        )}

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={loading !== null}
            onClick={() => exportar("pdf")}
          >
            {loading === "pdf" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileText className="h-4 w-4" />
            )}
            PDF
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={loading !== null}
            onClick={() => exportar("xlsx")}
          >
            {loading === "xlsx" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileSpreadsheet className="h-4 w-4" />
            )}
            Excel
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={loading !== null}
            onClick={() => exportar("csv")}
          >
            {loading === "csv" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            CSV
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
