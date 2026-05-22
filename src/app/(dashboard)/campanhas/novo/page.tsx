"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function NovaCampanhaPage() {
  const router = useRouter();
  const [slug, setSlug] = useState("");
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);

  function slugify(t: string) {
    return t
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    setSalvando(true);

    const res = await fetch("/api/portal/campanhas", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slug: slug || slugify(titulo),
        titulo,
        descricao,
      }),
    });
    const j = await res.json();
    setSalvando(false);

    if (!j.success) {
      setErro(j.error ?? "Erro ao criar");
      return;
    }
    router.push(`/campanhas/${j.data.id}`);
  }

  return (
    <>
      <Header title="Nova campanha" />
      <div className="page-content mx-auto max-w-lg">
        <Link href="/campanhas" className="mb-4 inline-flex items-center gap-1 text-sm text-muted">
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Link>
        <Card>
          <CardHeader>
            <CardTitle>Dados da campanha</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Título</label>
                <Input
                  required
                  value={titulo}
                  onChange={(e) => {
                    setTitulo(e.target.value);
                    if (!slug) setSlug(slugify(e.target.value));
                  }}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Slug (URL)</label>
                <Input
                  required
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="minha-campanha"
                  className="mt-1 font-mono text-sm"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Descrição</label>
                <textarea
                  className="mt-1 min-h-[80px] w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                  value={descricao}
                  onChange={(e) => setDescricao(e.target.value)}
                />
              </div>
              {erro && <p className="text-sm text-red-600">{erro}</p>}
              <Button type="submit" disabled={salvando} className="w-full">
                {salvando ? "Criando..." : "Criar campanha"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
