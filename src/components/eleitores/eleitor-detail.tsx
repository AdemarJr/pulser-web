"use client";

import Link from "next/link";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCPF, formatPhone } from "@/lib/utils";
import { maskCEP, maskRG, maskTituloEleitor } from "@/lib/formatters";
import type { Eleitor } from "@/types/database";
import type { AuthMe } from "@/lib/eleitores/client-permissions";
import { canDeleteEleitor, canEditEleitor } from "@/lib/eleitores/client-permissions";

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium text-muted">{label}</dt>
      <dd className="mt-0.5 text-sm text-foreground">{value || "—"}</dd>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2">{children}</CardContent>
    </Card>
  );
}

type Props = {
  eleitor: Eleitor & {
    cadastrador?: { nome_completo: string } | { nome_completo: string }[] | null;
    cidade?: { nome: string; estado?: { sigla: string; nome: string } } | null;
  };
  auth: AuthMe;
  onDelete: () => void;
  deleting?: boolean;
};

export function EleitorDetail({ eleitor, auth, onDelete, deleting }: Props) {
  const bairro = (eleitor.bairro as { nome: string } | undefined)?.nome ?? "—";
  const cidade = (eleitor.cidade as { nome: string } | undefined)?.nome ?? "—";
  const estadoRel = eleitor.cidade as { estado?: { sigla: string } } | undefined;
  const uf = estadoRel?.estado?.sigla ?? "—";
  const zona = (eleitor.zona_eleitoral as { numero: number } | undefined)?.numero ?? "—";
  const cadastrador = eleitor.cadastrador as { nome_completo: string } | { nome_completo: string }[] | null | undefined;
  const cadastradorNome = Array.isArray(cadastrador)
    ? cadastrador[0]?.nome_completo
    : cadastrador?.nome_completo;

  const podeEditar = canEditEleitor(auth, eleitor);
  const podeExcluir = canDeleteEleitor(auth, eleitor);

  const dataNasc = eleitor.data_nascimento?.includes("T")
    ? eleitor.data_nascimento.slice(0, 10).split("-").reverse().join("/")
    : eleitor.data_nascimento;

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-foreground">{eleitor.nome_completo}</h2>
          {eleitor.nome_social && (
            <p className="text-sm text-muted">Nome social: {eleitor.nome_social}</p>
          )}
          <span className="mt-2 inline-block rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium capitalize text-blue-800 dark:bg-blue-900/50 dark:text-blue-200">
            {eleitor.situacao}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {podeEditar && (
            <Link href={`/eleitores/${eleitor.id}/editar`}>
              <Button size="sm" variant="outline">
                <Pencil className="h-4 w-4" />
                Editar
              </Button>
            </Link>
          )}
          {podeExcluir && (
            <Button
              size="sm"
              variant="destructive"
              disabled={deleting}
              onClick={onDelete}
            >
              <Trash2 className="h-4 w-4" />
              {deleting ? "Excluindo..." : "Excluir"}
            </Button>
          )}
        </div>
      </div>

      <Section title="Dados pessoais">
        <Field label="CPF" value={formatCPF(eleitor.cpf)} />
        <Field label="RG" value={maskRG(eleitor.rg)} />
        <Field label="Data de nascimento" value={dataNasc} />
        <Field label="Sexo" value={eleitor.sexo.replace("_", " ")} />
        <Field label="Telefone principal" value={formatPhone(eleitor.telefone_principal)} />
        <Field
          label="Telefone secundário"
          value={eleitor.telefone_secundario ? formatPhone(eleitor.telefone_secundario) : "—"}
        />
        <Field label="E-mail" value={eleitor.email ?? "—"} />
        <Field label="Cadastrado por" value={cadastradorNome ?? "—"} />
      </Section>

      <Section title="Endereço">
        <Field label="CEP" value={maskCEP(eleitor.cep)} />
        <Field label="Logradouro" value={`${eleitor.logradouro}, ${eleitor.numero}`} />
        <Field label="Complemento" value={eleitor.complemento ?? "—"} />
        <Field label="Bairro" value={bairro} />
        <Field label="Município" value={`${cidade} / ${uf}`} />
      </Section>

      <Section title="Dados eleitorais">
        <Field label="Título" value={maskTituloEleitor(eleitor.titulo_eleitor)} />
        <Field label="Zona eleitoral" value={String(zona)} />
        <Field label="Seção" value={eleitor.secao_eleitoral} />
        <Field label="Município eleitoral" value={eleitor.municipio_eleitoral} />
        <Field label="Situação eleitoral" value={eleitor.situacao_eleitoral} />
        <Field label="Local de votação" value={eleitor.local_votacao ?? "—"} />
        <Field label="Prioridade" value={String(eleitor.prioridade ?? 0)} />
        <Field label="Categoria" value={eleitor.categoria ?? "—"} />
        <Field label="Liderança" value={eleitor.lideranca_responsavel ?? "—"} />
        <Field label="Grupo político" value={eleitor.grupo_politico ?? "—"} />
        {eleitor.observacoes && (
          <div className="sm:col-span-2">
            <Field label="Observações" value={eleitor.observacoes} />
          </div>
        )}
      </Section>

      <p className="text-xs text-muted">
        Criado em {new Date(eleitor.created_at).toLocaleString("pt-BR")}
        {eleitor.updated_at &&
          ` · Atualizado em ${new Date(eleitor.updated_at).toLocaleString("pt-BR")}`}
      </p>
    </div>
  );
}
