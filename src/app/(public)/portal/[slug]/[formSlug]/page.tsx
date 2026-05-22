"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { FormularioPublico } from "@/components/portal/formulario-publico";

export default function PortalFormularioPage() {
  const params = useParams();
  const campanhaSlug = params.slug as string;
  const formSlug = params.formSlug as string;
  const [dados, setDados] = useState<Parameters<typeof FormularioPublico>[0]["dados"] | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/public/campanhas/${campanhaSlug}/${formSlug}?resultados=1`)
      .then((r) => r.json())
      .then((j) => {
        if (!j.success) {
          setError(j.error ?? "Formulário não encontrado");
        } else {
          setDados(j.data);
        }
        setLoading(false);
      });
  }, [campanhaSlug, formSlug]);

  if (loading) return <p className="text-sm text-muted">Carregando...</p>;
  if (error || !dados) {
    return (
      <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-950/40 dark:text-red-400">
        {error ?? "Formulário não encontrado"}
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <Link
        href={`/portal/${campanhaSlug}`}
        className="inline-flex items-center gap-1 text-sm text-muted hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        {dados.campanha.titulo}
      </Link>
      <FormularioPublico dados={dados} />
    </div>
  );
}
