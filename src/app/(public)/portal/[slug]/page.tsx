"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TIPO_FORMULARIO_LABEL, type Formulario, type PortalFormularioTipo } from "@/lib/portal/types";

type CampanhaDetalhe = {
  id: string;
  slug: string;
  titulo: string;
  descricao: string | null;
  formularios: Formulario[];
};

export default function PortalCampanhaPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [campanha, setCampanha] = useState<CampanhaDetalhe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/public/campanhas/${slug}`)
      .then((r) => r.json())
      .then((j) => {
        if (!j.success) {
          setError(j.error ?? "Campanha não encontrada");
        } else {
          setCampanha(j.data);
        }
        setLoading(false);
      });
  }, [slug]);

  if (loading) return <p className="text-sm text-muted">Carregando...</p>;
  if (error || !campanha) {
    return (
      <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-950/40 dark:text-red-400">
        {error ?? "Campanha não encontrada"}
      </p>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link href="/portal" className="inline-flex items-center gap-1 text-sm text-muted hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />
        Voltar
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-foreground">{campanha.titulo}</h1>
        {campanha.descricao && (
          <p className="mt-2 text-muted">{campanha.descricao}</p>
        )}
      </div>

      <div className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
          Participe agora
        </h2>
        {campanha.formularios.length === 0 ? (
          <p className="text-sm text-muted">Nenhum formulário disponível.</p>
        ) : (
          campanha.formularios.map((f) => (
            <Link key={f.id} href={`/portal/${slug}/${f.slug}`}>
              <Card className="transition-colors hover:border-blue-300 dark:hover:border-blue-700">
                <CardHeader className="pb-2">
                  <span className="text-xs font-medium text-blue-600 dark:text-blue-400">
                    {TIPO_FORMULARIO_LABEL[f.tipo as PortalFormularioTipo]}
                  </span>
                  <CardTitle className="text-base">{f.titulo}</CardTitle>
                </CardHeader>
                {f.descricao && (
                  <CardContent className="pt-0">
                    <p className="line-clamp-2 text-sm text-muted">{f.descricao}</p>
                  </CardContent>
                )}
              </Card>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
