"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, ClipboardList, HelpCircle, Vote } from "lucide-react";
import type { Campanha } from "@/lib/portal/types";

const DESTAQUES = [
  {
    icon: Vote,
    titulo: "Intenção de voto",
    desc: "Saiba tendências de voto de forma agregada e anônima.",
  },
  {
    icon: ClipboardList,
    titulo: "Enquetes",
    desc: "Prioridades do bairro, políticas públicas e temas locais.",
  },
  {
    icon: HelpCircle,
    titulo: "Quiz",
    desc: "Conteúdo educativo sobre cidadania e processo eleitoral.",
  },
  {
    icon: BarChart3,
    titulo: "Pesquisas",
    desc: "Opinião da comunidade para apoiar decisões.",
  },
];

export default function PortalHomePage() {
  const [campanhas, setCampanhas] = useState<Campanha[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/public/campanhas")
      .then((r) => r.json())
      .then((j) => {
        if (j.success) setCampanhas(j.data);
        setLoading(false);
      });
  }, []);

  return (
    <div className="mx-auto max-w-4xl space-y-10">
      <section className="text-center">
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Portal de Participação
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-muted">
          Participe de enquetes, pesquisas e consultas abertas. Suas respostas são
          anônimas e ajudam a entender a opinião da comunidade.
        </p>
      </section>

      <section className="grid gap-3 sm:grid-cols-2">
        {DESTAQUES.map((d) => (
          <Card key={d.titulo} className="border-border/80">
            <CardContent className="flex gap-3 pt-4">
              <d.icon className="h-8 w-8 shrink-0 text-blue-600 dark:text-blue-400" />
              <div>
                <p className="font-medium text-foreground">{d.titulo}</p>
                <p className="mt-0.5 text-sm text-muted">{d.desc}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold text-foreground">Campanhas abertas</h2>
        {loading ? (
          <p className="text-sm text-muted">Carregando...</p>
        ) : campanhas.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border px-4 py-8 text-center text-sm text-muted">
            Nenhuma campanha publicada no momento.
          </p>
        ) : (
          <div className="space-y-3">
            {campanhas.map((c) => (
              <Link key={c.id} href={`/portal/${c.slug}`}>
                <Card className="transition-colors hover:border-blue-300 dark:hover:border-blue-700">
                  <CardHeader>
                    <CardTitle className="text-lg">{c.titulo}</CardTitle>
                    {c.descricao && (
                      <p className="line-clamp-2 text-sm text-muted">{c.descricao}</p>
                    )}
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
