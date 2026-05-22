"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Props = {
  resultados: {
    total_participacoes: number;
    perguntas: {
      pergunta_id: string;
      texto: string;
      opcoes: { id: string; label: string; total: number }[];
    }[];
  };
};

export function PortalResultados({ resultados }: Props) {
  return (
    <Card className="border-blue-200 bg-blue-50/50 dark:border-blue-900 dark:bg-blue-950/20">
      <CardHeader>
        <CardTitle className="text-base">Resultados parciais</CardTitle>
        <p className="text-xs text-muted">
          {resultados.total_participacoes} participação(ões) concluída(s)
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {resultados.perguntas.map((p) => {
          const max = Math.max(...p.opcoes.map((o) => o.total), 1);
          return (
            <div key={p.pergunta_id}>
              <p className="mb-2 text-sm font-medium text-foreground">{p.texto}</p>
              <div className="space-y-2">
                {p.opcoes
                  .slice()
                  .sort((a, b) => b.total - a.total)
                  .map((o) => (
                    <div key={o.id}>
                      <div className="mb-0.5 flex justify-between text-xs">
                        <span>{o.label}</span>
                        <span className="font-medium text-foreground">{o.total}</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                        <div
                          className="h-full rounded-full bg-blue-600 transition-all"
                          style={{ width: `${(o.total / max) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
