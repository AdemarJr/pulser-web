"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/layout/header";
import { Card, CardContent } from "@/components/ui/card";

interface LogItem {
  id: string;
  acao: string;
  entidade: string;
  created_at: string;
}

export default function AuditoriaPage() {
  const [logs, setLogs] = useState<LogItem[]>([]);

  useEffect(() => {
    // Consulta direta via Supabase client pode ser adicionada
    setLogs([]);
  }, []);

  return (
    <>
      <Header title="Auditoria" />
      <div className="page-content">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted">
              Logs automáticos via triggers PostgreSQL na tabela{" "}
              <code className="rounded bg-slate-100 px-1 dark:bg-slate-800">auditoria</code>.
              Registra quem criou, alterou ou excluiu, com histórico JSON completo.
            </p>
            {logs.length === 0 && (
              <p className="mt-4 text-sm text-muted">
                Nenhum registro exibido — conecte ao Supabase após aplicar migrations.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
