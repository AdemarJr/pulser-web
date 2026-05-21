"use client";

import { useState } from "react";
import Link from "next/link";
import { Download, Globe, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export function ReferenciaExterna() {
  const [uf, setUf] = useState("SP");
  const [loading, setLoading] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [preview, setPreview] = useState("");

  async function fetchReferencia(path: string, label: string) {
    setLoading(label);
    setMessage("");
    try {
      const res = await fetch(path);
      const json = await res.json();
      if (!json.success) {
        setMessage(json.error ?? "Erro na consulta");
        setPreview("");
        return;
      }
      setPreview(JSON.stringify(json.data, null, 2).slice(0, 2000));
      setMessage(`${label}: ${json.data.total ?? 0} registros`);
    } catch {
      setMessage("Falha ao consultar API");
    } finally {
      setLoading(null);
    }
  }

  async function syncIbge(todasUfs: boolean) {
    setLoading("sync");
    setMessage("");
    try {
      const body = todasUfs ? {} : { ufs: [uf.toUpperCase()] };
      const res = await fetch("/api/territorio/sync/ibge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!json.success) {
        setMessage(json.error ?? "Erro na sincronização");
        return;
      }
      setPreview(JSON.stringify(json.data, null, 2));
      const m = json.data.municipios;
      setMessage(
        `Importado: ${json.data.estados.inseridos + json.data.estados.atualizados} estados, ` +
          `${m.inseridos + m.atualizados} municípios (UFs: ${json.data.ufs_processadas.join(", ")})`
      );
    } catch {
      setMessage("Falha na sincronização");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="space-y-6">
      <Card className="border-indigo-200 bg-indigo-50/50 dark:border-indigo-800 dark:bg-indigo-950/30">
        <CardContent className="pt-6">
          <p className="text-sm text-indigo-900 dark:text-indigo-100">
            As APIs do <strong>IBGE</strong> e da <strong>BrasilAPI</strong> alimentam os
            cadastros de <strong>estados (UF)</strong> e <strong>municípios</strong>. Após
            sincronizar, os formulários de eleitores e demais telas usam a lista oficial no
            banco local. Bairros e zonas eleitorais continuam cadastrados manualmente.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Globe className="h-4 w-4" />
            Consultar APIs (referência)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">UF</label>
              <Input
                value={uf}
                onChange={(e) => setUf(e.target.value.toUpperCase().slice(0, 2))}
                className="w-20"
                maxLength={2}
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!!loading}
              onClick={() =>
                fetchReferencia("/api/territorio/referencia/ibge/estados", "IBGE estados")
              }
            >
              IBGE — Estados
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!!loading}
              onClick={() =>
                fetchReferencia(
                  `/api/territorio/referencia/ibge/estados/${uf}/municipios`,
                  "IBGE municípios"
                )
              }
            >
              IBGE — Municípios ({uf})
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!!loading}
              onClick={() =>
                fetchReferencia(
                  "/api/territorio/referencia/brasilapi/estados",
                  "BrasilAPI estados"
                )
              }
            >
              BrasilAPI — Estados
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={!!loading}
              onClick={() =>
                fetchReferencia(
                  `/api/territorio/referencia/brasilapi/estados/${uf}/municipios`,
                  "BrasilAPI municípios"
                )
              }
            >
              BrasilAPI — Municípios ({uf})
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Download className="h-4 w-4" />
            Importar estados e municípios (IBGE)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted">
            Grava no banco para uso em{" "}
            <Link href="/eleitores/novo" className="text-indigo-600 hover:underline">
              cadastro de eleitores
            </Link>
            . Requer permissão <code className="text-xs">territorio.gerenciar</code>.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              disabled={!!loading}
              onClick={() => syncIbge(false)}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Importar UF {uf || "—"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={!!loading}
              onClick={() => syncIbge(true)}
            >
              Importar todo o Brasil
            </Button>
          </div>
        </CardContent>
      </Card>

      {message && (
        <p className="rounded-lg bg-indigo-50 px-3 py-2 text-sm text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-200">
          {message}
        </p>
      )}
      {preview && (
        <pre className="max-h-64 overflow-auto rounded-lg bg-slate-900 p-4 text-xs text-slate-100">
          {preview}
          {preview.length >= 2000 ? "\n…" : ""}
        </pre>
      )}
    </div>
  );
}
