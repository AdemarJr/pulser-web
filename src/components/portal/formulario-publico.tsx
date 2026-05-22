"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PortalResultados } from "@/components/portal/portal-resultados";
import type { OpcaoPergunta, Pergunta, PortalFormularioTipo } from "@/lib/portal/types";
import { TIPO_FORMULARIO_LABEL } from "@/lib/portal/types";

type FormularioData = {
  campanha: { slug: string; titulo: string };
  formulario: {
    id: string;
    slug: string;
    tipo: PortalFormularioTipo;
    titulo: string;
    descricao: string | null;
    config: Record<string, unknown>;
  };
  perguntas: Pergunta[];
  resultados?: {
    total_participacoes: number;
    perguntas: {
      pergunta_id: string;
      texto: string;
      opcoes: { id: string; label: string; total: number }[];
    }[];
  } | null;
};

type Props = {
  dados: FormularioData;
};

export function FormularioPublico({ dados }: Props) {
  const { campanha, formulario, perguntas, resultados } = dados;
  const [respostas, setRespostas] = useState<Record<string, string | string[]>>({});
  const [consentimento, setConsentimento] = useState(false);
  const [faixaEtaria, setFaixaEtaria] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState<{ pontuacao: number | null; tipo: string } | null>(
    null
  );

  function setSingle(perguntaId: string, valor: string) {
    setRespostas((prev) => ({ ...prev, [perguntaId]: valor }));
  }

  function toggleMulti(perguntaId: string, opcaoId: string, max?: number) {
    setRespostas((prev) => {
      const atual = (prev[perguntaId] as string[] | undefined) ?? [];
      const exists = atual.includes(opcaoId);
      let next: string[];
      if (exists) {
        next = atual.filter((x) => x !== opcaoId);
      } else {
        if (max && atual.length >= max) return prev;
        next = [...atual, opcaoId];
      }
      return { ...prev, [perguntaId]: next };
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    setEnviando(true);

    const payload = {
      consentimento: true as const,
      respostas: perguntas
        .filter((p) => {
          const v = respostas[p.id];
          return v !== undefined && v !== "" && !(Array.isArray(v) && v.length === 0);
        })
        .map((p) => ({
          pergunta_id: p.id,
          valor: respostas[p.id],
        })),
      metadata: faixaEtaria
        ? { faixa_etaria: faixaEtaria as "18-24" | "25-34" | "35-44" | "45-59" | "60+" }
        : undefined,
    };

    if (!consentimento) {
      setErro("Aceite a política de privacidade para continuar.");
      setEnviando(false);
      return;
    }

    const res = await fetch(
      `/api/public/campanhas/${campanha.slug}/${formulario.slug}/participar`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    );
    const json = await res.json();
    setEnviando(false);

    if (!json.success) {
      setErro(json.error ?? "Não foi possível enviar");
      return;
    }

    setSucesso({ pontuacao: json.data.pontuacao, tipo: json.data.tipo });
  }

  if (sucesso) {
    return (
      <Card className="mx-auto max-w-lg">
        <CardHeader>
          <CardTitle>Obrigado pela participação!</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm text-muted">
          <p>Sua resposta foi registrada de forma anônima.</p>
          {sucesso.tipo === "quiz" && sucesso.pontuacao !== null && (
            <p className="text-lg font-semibold text-foreground">
              Pontuação: {sucesso.pontuacao} ponto(s)
            </p>
          )}
          <div className="flex flex-col gap-2 pt-2">
            <Link href={`/portal/${campanha.slug}`}>
              <Button variant="outline" className="w-full">
                Ver outras consultas
              </Button>
            </Link>
            <Link href="/portal">
              <Button variant="ghost" className="w-full">
                Voltar ao portal
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-blue-600 dark:text-blue-400">
          {TIPO_FORMULARIO_LABEL[formulario.tipo]}
        </p>
        <h1 className="mt-1 text-2xl font-bold text-foreground">{formulario.titulo}</h1>
        {formulario.descricao && (
          <p className="mt-2 text-sm text-muted">{formulario.descricao}</p>
        )}
      </div>

      {resultados && resultados.perguntas.length > 0 && (
        <PortalResultados resultados={resultados} />
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {perguntas.map((p) => (
          <PerguntaField
            key={p.id}
            pergunta={p}
            valor={respostas[p.id]}
            onSingle={setSingle}
            onMulti={toggleMulti}
            onTexto={(id, v) => setSingle(id, v)}
            onEscala={(id, v) => setSingle(id, v)}
          />
        ))}

        <Card>
          <CardContent className="space-y-3 pt-4">
            <label className="block text-sm font-medium text-foreground">
              Faixa etária (opcional)
            </label>
            <select
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
              value={faixaEtaria}
              onChange={(e) => setFaixaEtaria(e.target.value)}
            >
              <option value="">Prefiro não informar</option>
              <option value="18-24">18 a 24</option>
              <option value="25-34">25 a 34</option>
              <option value="35-44">35 a 44</option>
              <option value="45-59">45 a 59</option>
              <option value="60+">60 ou mais</option>
            </select>

            <label className="flex cursor-pointer items-start gap-2 text-sm">
              <input
                type="checkbox"
                checked={consentimento}
                onChange={(e) => setConsentimento(e.target.checked)}
                className="mt-1"
              />
              <span className="text-muted">
                Concordo com o tratamento anônimo dos dados conforme a LGPD. Não
                coletamos nome, CPF ou e-mail nesta participação.
              </span>
            </label>
          </CardContent>
        </Card>

        {erro && (
          <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600 dark:bg-red-950/40 dark:text-red-400">
            {erro}
          </p>
        )}

        <Button type="submit" className="w-full" disabled={enviando}>
          {enviando ? "Enviando..." : "Enviar respostas"}
        </Button>
      </form>
    </div>
  );
}

function PerguntaField({
  pergunta,
  valor,
  onSingle,
  onMulti,
  onTexto,
  onEscala,
}: {
  pergunta: Pergunta;
  valor: string | string[] | undefined;
  onSingle: (id: string, v: string) => void;
  onMulti: (id: string, opcaoId: string, max?: number) => void;
  onTexto: (id: string, v: string) => void;
  onEscala: (id: string, v: string) => void;
}) {
  const opcoes = pergunta.opcoes as OpcaoPergunta[];
  const maxSelecoes = pergunta.config?.max_selecoes as number | undefined;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">
          {pergunta.texto}
          {pergunta.obrigatoria && <span className="text-red-500"> *</span>}
        </CardTitle>
        {maxSelecoes && (
          <p className="text-xs text-muted">Máximo {maxSelecoes} opções</p>
        )}
      </CardHeader>
      <CardContent className="space-y-2">
        {(pergunta.tipo === "single" || pergunta.tipo === "intencao_candidato") &&
          opcoes.map((o) => (
            <label
              key={o.id}
              className="flex cursor-pointer items-center gap-3 rounded-lg border border-border px-3 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/50"
            >
              <input
                type="radio"
                name={pergunta.id}
                checked={valor === o.id}
                onChange={() => onSingle(pergunta.id, o.id)}
              />
              <span className="text-sm">{o.label}</span>
            </label>
          ))}

        {pergunta.tipo === "multi" &&
          opcoes.map((o) => {
            const selected = Array.isArray(valor) && valor.includes(o.id);
            return (
              <label
                key={o.id}
                className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 ${
                  selected
                    ? "border-blue-400 bg-blue-50 dark:bg-blue-950/30"
                    : "border-border hover:bg-slate-50 dark:hover:bg-slate-800/50"
                }`}
              >
                <input
                  type="checkbox"
                  checked={selected}
                  onChange={() => onMulti(pergunta.id, o.id, maxSelecoes)}
                />
                <span className="text-sm">{o.label}</span>
              </label>
            );
          })}

        {pergunta.tipo === "texto" && (
          <textarea
            className="min-h-[80px] w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
            value={(valor as string) ?? ""}
            onChange={(e) => onTexto(pergunta.id, e.target.value)}
            placeholder="Sua resposta..."
          />
        )}

        {pergunta.tipo === "escala" && (
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => onEscala(pergunta.id, String(n))}
                className={`h-10 w-10 rounded-full border text-sm font-medium ${
                  valor === String(n)
                    ? "border-blue-500 bg-blue-600 text-white"
                    : "border-border hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
