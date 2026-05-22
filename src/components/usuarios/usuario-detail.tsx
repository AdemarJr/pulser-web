"use client";

import Link from "next/link";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PerfilPermissoesPanel } from "@/components/usuarios/perfil-permissoes-panel";
import { formatCPF, formatPhone } from "@/lib/utils";

type Permissao = { slug: string; nome: string; modulo: string };

export type UsuarioDetalhe = {
  id: string;
  nome_completo: string;
  email: string;
  telefone: string | null;
  cpf: string | null;
  status: string;
  ultimo_acesso: string | null;
  created_at: string;
  perfil?: { nome: string; slug: string; descricao: string | null } | null;
  permissoes?: Permissao[];
};

type Props = {
  usuario: UsuarioDetalhe;
  podeEditar: boolean;
  podeExcluir: boolean;
  onDelete: () => void;
  deleting?: boolean;
};

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium text-muted">{label}</dt>
      <dd className="mt-0.5 text-sm text-foreground">{value || "—"}</dd>
    </div>
  );
}

export function UsuarioDetail({
  usuario,
  podeEditar,
  podeExcluir,
  onDelete,
  deleting,
}: Props) {
  const perfil = usuario.perfil;

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-foreground">{usuario.nome_completo}</h2>
          <p className="text-sm text-muted">{usuario.email}</p>
          <span className="mt-2 inline-block rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium capitalize text-blue-800 dark:bg-blue-900/50 dark:text-blue-200">
            {usuario.status}
          </span>
        </div>
        <div className="flex gap-2">
          {podeEditar && (
            <Link href={`/usuarios/${usuario.id}/editar`}>
              <Button size="sm" variant="outline">
                <Pencil className="h-4 w-4" />
                Editar
              </Button>
            </Link>
          )}
          {podeExcluir && (
            <Button size="sm" variant="destructive" disabled={deleting} onClick={onDelete}>
              <Trash2 className="h-4 w-4" />
              {deleting ? "Excluindo..." : "Excluir"}
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Perfil e hierarquia</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field label="Perfil" value={perfil?.nome ?? "—"} />
          <Field label="Slug" value={perfil?.slug ?? "—"} />
          <Field label="Descrição" value={perfil?.descricao ?? "—"} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Dados cadastrais</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Telefone"
            value={usuario.telefone ? formatPhone(usuario.telefone) : "—"}
          />
          <Field label="CPF" value={usuario.cpf ? formatCPF(usuario.cpf) : "—"} />
          <Field
            label="Último acesso"
            value={
              usuario.ultimo_acesso
                ? new Date(usuario.ultimo_acesso).toLocaleString("pt-BR")
                : "—"
            }
          />
          <Field
            label="Cadastro em"
            value={new Date(usuario.created_at).toLocaleString("pt-BR")}
          />
        </CardContent>
      </Card>

      <PerfilPermissoesPanel
        permissoes={usuario.permissoes ?? []}
        perfilNome={perfil?.nome}
      />
    </div>
  );
}
