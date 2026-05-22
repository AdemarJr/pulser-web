"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { UsuarioListActions } from "@/components/usuarios/usuario-list-actions";
import { Plus } from "lucide-react";
import { ConfirmDialog } from "@/components/ui/action-dialog";
import { useConfirmDelete } from "@/hooks/use-confirm-delete";
import { nomePerfilUsuario } from "@/lib/auth/usuarios-access";
import {
  authMeUsuariosFromApi,
  canManageUsuariosList,
  canViewUsuariosList,
  type AuthMeUsuarios,
} from "@/lib/usuarios/client-permissions";
import type { Usuario } from "@/types/database";

function UsuarioCard({
  u,
  auth,
  onDelete,
  deletingId,
  onOpen,
}: {
  u: Usuario;
  auth: AuthMeUsuarios | null;
  onDelete: (id: string, nome: string) => void;
  deletingId: string | null;
  onOpen: (id: string) => void;
}) {
  const perfil = nomePerfilUsuario(u);
  const criador = (u as Usuario & { criador?: { nome_completo: string } | null }).criador
    ?.nome_completo;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpen(u.id)}
      onKeyDown={(ev) => ev.key === "Enter" && onOpen(u.id)}
      className="cursor-pointer rounded-lg border border-border bg-card p-4 shadow-sm transition-colors hover:border-blue-300 dark:hover:border-blue-700"
    >
      <p className="font-semibold text-foreground">{u.nome_completo}</p>
      <p className="mt-1 truncate text-sm text-muted">{u.email}</p>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
        <span className="rounded-full bg-slate-100 px-2 py-0.5 font-medium text-foreground dark:bg-slate-800">
          {perfil}
        </span>
        <span className="rounded-full bg-indigo-100 px-2 py-0.5 font-medium capitalize text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-200">
          {u.status}
        </span>
        {criador && (
          <span className="text-muted">Cadastrado por: {criador}</span>
        )}
      </div>
      <UsuarioListActions
        usuario={{
          id: u.id,
          nome_completo: u.nome_completo,
          perfil: u.perfil as { slug: string } | null,
        }}
        auth={auth}
        onDelete={onDelete}
        deletingId={deletingId}
        compact
      />
    </div>
  );
}

export default function UsuariosPage() {
  const router = useRouter();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [auth, setAuth] = useState<AuthMeUsuarios | null>(null);
  const [podeCriar, setPodeCriar] = useState(false);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState("");
  const [acessoNegado, setAcessoNegado] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const deleteConfirm = useConfirmDelete("usuário");

  const load = useCallback(() => {
    setLoading(true);
    setListError("");
    Promise.all([
      fetch("/api/usuarios", { credentials: "include" }).then((r) => r.json()),
      fetch("/api/auth/me", { credentials: "include" }).then((r) => r.json()),
    ]).then(([listRes, meRes]) => {
      if (listRes.success) setUsuarios(listRes.data);
      else setListError(listRes.error ?? "Não foi possível carregar os usuários.");
      if (meRes.success) {
        const me = authMeUsuariosFromApi({
          ...meRes.data,
          isSuperAdmin: meRes.data.isSuperAdmin,
        });
        if (!canViewUsuariosList(me)) {
          setAcessoNegado(true);
          setLoading(false);
          return;
        }
        setAuth(me);
        setPodeCriar(canManageUsuariosList(me));
      }
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function handleDelete(id: string, nome: string) {
    deleteConfirm.requestDelete(id, nome, async () => {
      setDeletingId(id);
      const res = await fetch(`/api/usuarios/${id}`, {
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
    });
  }

  const emptyMessage = loading ? "Carregando..." : "Nenhum usuário encontrado.";

  if (acessoNegado) {
    return (
      <>
        <Header title="Usuários" />
        <div className="page-content">
          <p className="text-sm text-muted">
            Você não tem permissão para acessar o módulo de usuários.
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      <Header title="Usuários" />
      <div className="page-content">
        {listError && (
          <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-950/40 dark:text-red-400">
            {listError}
          </p>
        )}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted">
            Gerencie contas, perfis e permissões herdadas por hierarquia.
          </p>
          {podeCriar && (
            <Link href="/usuarios/novo" className="shrink-0">
              <Button className="w-full sm:w-auto">
                <Plus className="h-4 w-4" />
                Novo usuário
              </Button>
            </Link>
          )}
        </div>

        <div className="space-y-3 lg:hidden">
          {loading || usuarios.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted">{emptyMessage}</p>
          ) : (
            usuarios.map((u) => (
              <UsuarioCard
                key={u.id}
                u={u}
                auth={auth}
                onDelete={handleDelete}
                deletingId={deletingId}
                onOpen={(id) => router.push(`/usuarios/${id}`)}
              />
            ))
          )}
        </div>

        <Card className="hidden lg:block">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-slate-100 dark:bg-slate-800">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">Nome</th>
                    <th className="px-4 py-3 text-left font-medium">E-mail</th>
                    <th className="px-4 py-3 text-left font-medium">Perfil</th>
                    <th className="px-4 py-3 text-left font-medium">Cadastrado por</th>
                    <th className="px-4 py-3 text-left font-medium">Status</th>
                    <th className="px-4 py-3 text-right font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-muted">
                        Carregando...
                      </td>
                    </tr>
                  ) : usuarios.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-muted">
                        Nenhum usuário encontrado.
                      </td>
                    </tr>
                  ) : (
                    usuarios.map((u) => (
                      <tr
                        key={u.id}
                        className="cursor-pointer border-b border-border hover:bg-slate-100 dark:hover:bg-slate-800/50"
                        onClick={() => router.push(`/usuarios/${u.id}`)}
                      >
                        <td className="px-4 py-3 font-medium">{u.nome_completo}</td>
                        <td className="px-4 py-3">{u.email}</td>
                        <td className="px-4 py-3">{nomePerfilUsuario(u)}</td>
                        <td className="px-4 py-3 text-muted">
                          {(
                            u as Usuario & { criador?: { nome_completo: string } | null }
                          ).criador?.nome_completo ?? "—"}
                        </td>
                        <td className="px-4 py-3 capitalize">{u.status}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end">
                            <UsuarioListActions
                              usuario={{
                                id: u.id,
                                nome_completo: u.nome_completo,
                                perfil: u.perfil as { slug: string } | null,
                              }}
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
            {!loading && usuarios.length > 0 && (
              <p className="border-t border-border px-4 py-3 text-sm text-muted">
                {usuarios.length} usuário(s)
              </p>
            )}
          </CardContent>
        </Card>
      </div>
      <ConfirmDialog {...deleteConfirm.dialogProps} />
    </>
  );
}
