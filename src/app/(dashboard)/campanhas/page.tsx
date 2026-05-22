"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExternalLink, Plus } from "lucide-react";
import { TIPO_FORMULARIO_LABEL, type PortalFormularioTipo } from "@/lib/portal/types";

type CampanhaRow = {
  id: string;
  slug: string;
  titulo: string;
  descricao: string | null;
  status: string;
  formularios?: {
    id: string;
    slug: string;
    tipo: string;
    titulo: string;
    status: string;
  }[];
};

export default function CampanhasAdminPage() {
  const router = useRouter();
  const [items, setItems] = useState<CampanhaRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [podeGerenciar, setPodeGerenciar] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/portal/campanhas", { credentials: "include" }).then((r) => r.json()),
      fetch("/api/auth/me", { credentials: "include" }).then((r) => r.json()),
    ]).then(([listRes, meRes]) => {
      if (listRes.success) setItems(listRes.data);
      if (meRes.success) {
        setPodeGerenciar(
          (meRes.data.permissions ?? []).includes("portal.gerenciar")
        );
      }
      setLoading(false);
    });
  }, []);

  async function publicarCampanha(id: string) {
    const res = await fetch(`/api/portal/campanhas/${id}`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "publicado" }),
    });
    const j = await res.json();
    if (j.success) router.refresh();
    else alert(j.error ?? "Erro");
    window.location.reload();
  }

  return (
    <>
      <Header title="Campanhas públicas" />
      <div className="page-content space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted">
            Crie enquetes, quiz, pesquisas e intenção de voto para o portal aberto em{" "}
            <Link href="/portal" className="text-blue-600 hover:underline dark:text-blue-400">
              /portal
            </Link>
            .
          </p>
          {podeGerenciar && (
            <Link href="/campanhas/novo">
              <Button>
                <Plus className="h-4 w-4" />
                Nova campanha
              </Button>
            </Link>
          )}
        </div>

        {loading ? (
          <p className="text-sm text-muted">Carregando...</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted">Nenhuma campanha cadastrada.</p>
        ) : (
          <div className="space-y-4">
            {items.map((c) => (
              <Card key={c.id}>
                <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-lg">{c.titulo}</CardTitle>
                    <p className="text-xs text-muted">/{c.slug}</p>
                    <span className="mt-2 inline-block rounded-full bg-slate-100 px-2 py-0.5 text-xs capitalize dark:bg-slate-800">
                      {c.status}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    {c.status === "publicado" && (
                      <Link href={`/portal/${c.slug}`} target="_blank">
                        <Button size="sm" variant="outline">
                          <ExternalLink className="h-4 w-4" />
                          Ver portal
                        </Button>
                      </Link>
                    )}
                    <Link href={`/campanhas/${c.id}`}>
                      <Button size="sm" variant="secondary">
                        Gerenciar
                      </Button>
                    </Link>
                    {podeGerenciar && c.status !== "publicado" && (
                      <Button size="sm" onClick={() => publicarCampanha(c.id)}>
                        Publicar
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-1 text-sm text-muted">
                    {(c.formularios ?? []).map((f) => (
                      <li key={f.id}>
                        {TIPO_FORMULARIO_LABEL[f.tipo as PortalFormularioTipo]} — {f.titulo}{" "}
                        <span className="text-xs">({f.status})</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
