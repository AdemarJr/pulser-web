"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { TIPO_FORMULARIO_LABEL, type PortalFormularioTipo } from "@/lib/portal/types";

type Formulario = {
  id: string;
  slug: string;
  tipo: string;
  titulo: string;
  status: string;
  perguntas?: { id: string; texto: string; ordem: number }[];
};

type Campanha = {
  id: string;
  slug: string;
  titulo: string;
  status: string;
  formularios?: Formulario[];
};

export default function CampanhaDetalheAdminPage() {
  const params = useParams();
  const id = params.id as string;
  const [campanha, setCampanha] = useState<Campanha | null>(null);
  const [loading, setLoading] = useState(true);

  const [formSlug, setFormSlug] = useState("");
  const [formTitulo, setFormTitulo] = useState("");
  const [formTipo, setFormTipo] = useState<PortalFormularioTipo>("enquete");

  const [perguntaFormId, setPerguntaFormId] = useState("");
  const [perguntaTexto, setPerguntaTexto] = useState("");
  const [perguntaTipo, setPerguntaTipo] = useState("single");
  const [opcoesTexto, setOpcoesTexto] = useState("Opção A|Opção B|Opção C");

  const load = useCallback(() => {
    fetch(`/api/portal/campanhas/${id}`, { credentials: "include" })
      .then((r) => r.json())
      .then((j) => {
        if (j.success) setCampanha(j.data);
        setLoading(false);
      });
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function criarFormulario(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch(`/api/portal/campanhas/${id}/formularios`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slug: formSlug,
        titulo: formTitulo,
        tipo: formTipo,
        config: { mostrar_resultados_publicos: formTipo !== "quiz" },
      }),
    });
    const j = await res.json();
    if (!j.success) alert(j.error);
    else {
      setFormSlug("");
      setFormTitulo("");
      load();
    }
  }

  async function adicionarPergunta(e: React.FormEvent) {
    e.preventDefault();
    if (!perguntaFormId) return;

    const opcoes = opcoesTexto
      .split("|")
      .map((label, i) => ({
        id: `opt_${i + 1}`,
        label: label.trim(),
        correta: perguntaTipo === "single" && i === 0 ? false : undefined,
      }))
      .filter((o) => o.label);

    const res = await fetch(`/api/portal/formularios/${perguntaFormId}/perguntas`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        texto: perguntaTexto,
        tipo: perguntaTipo,
        opcoes,
        ordem: 0,
      }),
    });
    const j = await res.json();
    if (!j.success) alert(j.error);
    else {
      setPerguntaTexto("");
      load();
    }
  }

  async function publicarFormulario(formularioId: string) {
    const res = await fetch(`/api/portal/formularios/${formularioId}/publicar`, {
      method: "POST",
      credentials: "include",
    });
    const j = await res.json();
    if (!j.success) alert(j.error);
    else load();
  }

  if (loading) {
    return (
      <>
        <Header title="Campanha" />
        <div className="page-content">
          <p className="text-sm text-muted">Carregando...</p>
        </div>
      </>
    );
  }

  if (!campanha) {
    return (
      <>
        <Header title="Campanha" />
        <div className="page-content">
          <p className="text-sm text-red-600">Campanha não encontrada</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Header title={campanha.titulo} />
      <div className="page-content mx-auto max-w-3xl space-y-6">
        <Link href="/campanhas" className="inline-flex items-center gap-1 text-sm text-muted">
          <ArrowLeft className="h-4 w-4" />
          Campanhas
        </Link>

        <div className="flex flex-wrap gap-2">
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs capitalize dark:bg-slate-800">
            {campanha.status}
          </span>
          {campanha.status === "publicado" && (
            <Link href={`/portal/${campanha.slug}`} target="_blank">
              <Button size="sm" variant="outline">
                <ExternalLink className="h-4 w-4" />
                Abrir portal público
              </Button>
            </Link>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Formulários</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {(campanha.formularios ?? []).map((f) => (
              <div key={f.id} className="rounded-lg border border-border p-3">
                <p className="font-medium">
                  {TIPO_FORMULARIO_LABEL[f.tipo as PortalFormularioTipo]} — {f.titulo}
                </p>
                <p className="text-xs text-muted">/{f.slug} · {f.status}</p>
                <ul className="mt-2 text-sm text-muted">
                  {(f.perguntas ?? []).map((p) => (
                    <li key={p.id}>• {p.texto}</li>
                  ))}
                </ul>
                {f.status !== "publicado" && (
                  <Button
                    size="sm"
                    className="mt-2"
                    onClick={() => publicarFormulario(f.id)}
                  >
                    Publicar formulário
                  </Button>
                )}
                {f.status === "publicado" && (
                  <Link
                    href={`/portal/${campanha.slug}/${f.slug}`}
                    target="_blank"
                    className="mt-2 inline-block text-sm text-blue-600 hover:underline"
                  >
                    Link público
                  </Link>
                )}
              </div>
            ))}

            <form onSubmit={criarFormulario} className="space-y-3 border-t border-border pt-4">
              <p className="text-sm font-medium">Novo formulário</p>
              <Input
                placeholder="slug-do-formulario"
                value={formSlug}
                onChange={(e) => setFormSlug(e.target.value)}
                required
              />
              <Input
                placeholder="Título"
                value={formTitulo}
                onChange={(e) => setFormTitulo(e.target.value)}
                required
              />
              <select
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                value={formTipo}
                onChange={(e) => setFormTipo(e.target.value as PortalFormularioTipo)}
              >
                <option value="enquete">Enquete</option>
                <option value="quiz">Quiz</option>
                <option value="pesquisa">Pesquisa</option>
                <option value="intencao_voto">Intenção de voto</option>
              </select>
              <Button type="submit" size="sm">
                Adicionar formulário
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Adicionar pergunta</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={adicionarPergunta} className="space-y-3">
              <select
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                value={perguntaFormId}
                onChange={(e) => setPerguntaFormId(e.target.value)}
                required
              >
                <option value="">Formulário</option>
                {(campanha.formularios ?? []).map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.titulo}
                  </option>
                ))}
              </select>
              <textarea
                className="min-h-[60px] w-full rounded-lg border border-border px-3 py-2 text-sm"
                placeholder="Texto da pergunta"
                value={perguntaTexto}
                onChange={(e) => setPerguntaTexto(e.target.value)}
                required
              />
              <select
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                value={perguntaTipo}
                onChange={(e) => setPerguntaTipo(e.target.value)}
              >
                <option value="single">Escolha única</option>
                <option value="multi">Múltipla escolha</option>
                <option value="intencao_candidato">Intenção (candidatos)</option>
                <option value="texto">Texto livre</option>
                <option value="escala">Escala 1-5</option>
              </select>
              {perguntaTipo !== "texto" && perguntaTipo !== "escala" && (
                <Input
                  placeholder="Opções separadas por | (pipe)"
                  value={opcoesTexto}
                  onChange={(e) => setOpcoesTexto(e.target.value)}
                />
              )}
              <Button type="submit" size="sm">
                Adicionar pergunta
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
