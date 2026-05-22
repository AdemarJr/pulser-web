"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { EleitorListActions } from "@/components/eleitores/eleitor-list-actions";
import { Plus, Search } from "lucide-react";
import { formatCPF } from "@/lib/utils";
import type { AuthMe } from "@/lib/eleitores/client-permissions";
import type { Eleitor } from "@/types/database";

function EleitorCard({
  e,
  auth,
  onDelete,
  deletingId,
  onOpen,
}: {
  e: Eleitor;
  auth: AuthMe | null;
  onDelete: (id: string, nome: string) => void;
  deletingId: string | null;
  onOpen: (id: string) => void;
}) {
  const bairro = (e.bairro as { nome: string } | undefined)?.nome ?? "-";
  const zona = (e.zona_eleitoral as { numero: number } | undefined)?.numero ?? "-";
  const cidadeCadastro =
    (e as Eleitor & { cidade_cadastro?: { nome: string } }).cidade_cadastro?.nome ?? "-";

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpen(e.id)}
      onKeyDown={(ev) => ev.key === "Enter" && onOpen(e.id)}
      className="cursor-pointer rounded-lg border border-border bg-card p-4 shadow-sm transition-colors hover:border-blue-300 dark:hover:border-blue-700"
    >
      <p className="font-semibold text-foreground">{e.nome_completo}</p>
      <p className="mt-1 text-sm text-muted">{formatCPF(e.cpf)}</p>
      <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
        <div>
          <dt className="text-muted">Bairro</dt>
          <dd className="font-medium text-foreground">{bairro}</dd>
        </div>
        <div>
          <dt className="text-muted">Zona</dt>
          <dd className="font-medium text-foreground">{zona}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-muted">Cadastro em</dt>
          <dd className="font-medium text-foreground">{cidadeCadastro}</dd>
        </div>
      </dl>
      <span className="mt-3 inline-block rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium capitalize text-blue-800 dark:bg-blue-900/50 dark:text-blue-200">
        {e.situacao}
      </span>
      <EleitorListActions
        eleitor={e}
        auth={auth}
        onDelete={onDelete}
        deletingId={deletingId}
        compact
      />
    </div>
  );
}

export default function EleitoresPage() {
  const router = useRouter();
  const [items, setItems] = useState<Eleitor[]>([]);
  const [total, setTotal] = useState(0);
  const [nome, setNome] = useState("");
  const [loading, setLoading] = useState(true);
  const [escopo, setEscopo] = useState<"proprios" | "todos">("proprios");
  const [auth, setAuth] = useState<AuthMe | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (nome) params.set("nome", nome);
    params.set("limit", "100");

    Promise.all([
      fetch(`/api/eleitores?${params}`, { credentials: "include" }).then((r) => r.json()),
      fetch("/api/auth/me", { credentials: "include" }).then((r) => r.json()),
    ]).then(([listRes, meRes]) => {
      if (listRes.success) {
        setItems(listRes.data.items);
        setTotal(listRes.data.total);
        if (listRes.data.escopo) setEscopo(listRes.data.escopo);
      }
      if (meRes.success) {
        setAuth({
          user: { id: meRes.data.user.id },
          permissions: meRes.data.permissions ?? [],
          canViewAllEleitores: meRes.data.canViewAllEleitores === true,
        });
      }
      setLoading(false);
    });
  }, [nome]);

  useEffect(() => {
    load();
  }, []);

  async function handleDelete(id: string, nomeEleitor: string) {
    const ok = window.confirm(`Excluir o cadastro de "${nomeEleitor}"?`);
    if (!ok) return;

    setDeletingId(id);
    const res = await fetch(`/api/eleitores/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    const json = await res.json();
    setDeletingId(null);

    if (!json.success) {
      alert(json.error ?? "Não foi possível excluir");
      return;
    }
    load();
  }

  const emptyMessage = loading ? "Carregando..." : "Nenhum eleitor encontrado.";

  return (
    <>
      <Header title={escopo === "todos" ? "Eleitores" : "Meus eleitores"} />
      <div className="page-content">
        {escopo === "proprios" && (
          <p className="mb-4 rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-800 dark:bg-blue-950/50 dark:text-blue-200">
            Exibindo apenas os cadastros que você registrou. O administrador visualiza todos.
          </p>
        )}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex w-full gap-2 sm:max-w-md">
            <Input
              placeholder="Buscar por nome..."
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="min-w-0 flex-1"
              onKeyDown={(e) => e.key === "Enter" && load()}
            />
            <Button variant="secondary" onClick={load} className="shrink-0 px-3">
              <Search className="h-4 w-4" />
              <span className="sr-only">Buscar</span>
            </Button>
          </div>
          <Link href="/eleitores/novo" className="hidden shrink-0 lg:block">
            <Button className="w-full sm:w-auto">
              <Plus className="h-4 w-4" />
              Novo eleitor
            </Button>
          </Link>
        </div>

        <div className="space-y-3 lg:hidden">
          {loading || items.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted">{emptyMessage}</p>
          ) : (
            items.map((e) => (
              <EleitorCard
                key={e.id}
                e={e}
                auth={auth}
                onDelete={handleDelete}
                deletingId={deletingId}
                onOpen={(id) => router.push(`/eleitores/${id}`)}
              />
            ))
          )}
          {!loading && items.length > 0 && (
            <p className="pt-2 text-center text-sm text-muted">
              {total} registro(s) encontrado(s)
            </p>
          )}
        </div>

        <Card className="hidden lg:block">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-slate-100 dark:bg-slate-800">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">Nome</th>
                    <th className="px-4 py-3 text-left font-medium">CPF</th>
                    <th className="px-4 py-3 text-left font-medium">Cadastro em</th>
                    <th className="px-4 py-3 text-left font-medium">Bairro</th>
                    <th className="px-4 py-3 text-left font-medium">Zona</th>
                    <th className="px-4 py-3 text-left font-medium">Situação</th>
                    <th className="px-4 py-3 text-right font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-muted">
                        Carregando...
                      </td>
                    </tr>
                  ) : items.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-muted">
                        Nenhum eleitor encontrado.
                      </td>
                    </tr>
                  ) : (
                    items.map((e) => (
                      <tr
                        key={e.id}
                        className="cursor-pointer border-b border-border hover:bg-slate-100 dark:hover:bg-slate-800/50"
                        onClick={() => router.push(`/eleitores/${e.id}`)}
                      >
                        <td className="px-4 py-3 font-medium">{e.nome_completo}</td>
                        <td className="px-4 py-3">{formatCPF(e.cpf)}</td>
                        <td className="px-4 py-3">
                          {(
                            e as Eleitor & { cidade_cadastro?: { nome: string } }
                          ).cidade_cadastro?.nome ?? "—"}
                        </td>
                        <td className="px-4 py-3">
                          {(e.bairro as { nome: string } | undefined)?.nome ?? "-"}
                        </td>
                        <td className="px-4 py-3">
                          {(e.zona_eleitoral as { numero: number } | undefined)?.numero ?? "-"}
                        </td>
                        <td className="px-4 py-3">
                          <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium capitalize text-blue-800 dark:bg-blue-900/50 dark:text-blue-200">
                            {e.situacao}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end">
                            <EleitorListActions
                              eleitor={e}
                              auth={auth}
                              onDelete={handleDelete}
                              deletingId={deletingId}
                            />
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <p className="border-t border-border px-4 py-3 text-sm text-muted">
              {total} registro(s) encontrado(s)
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
