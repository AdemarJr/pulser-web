"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { UsuarioDetail, type UsuarioDetalhe } from "@/components/usuarios/usuario-detail";
import { ConfirmDialog } from "@/components/ui/action-dialog";
import { useConfirmDelete } from "@/hooks/use-confirm-delete";
import {
  authMeUsuariosFromApi,
  canDeleteUsuarioClient,
  canEditUsuarioClient,
} from "@/lib/usuarios/client-permissions";

export default function UsuarioDetalhePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [usuario, setUsuario] = useState<UsuarioDetalhe | null>(null);
  const [podeEditar, setPodeEditar] = useState(false);
  const [podeExcluir, setPodeExcluir] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(false);
  const deleteConfirm = useConfirmDelete("usuário");

  const load = useCallback(() => {
    setLoading(true);
    setError("");
    Promise.all([
      fetch(`/api/usuarios/${id}`, { credentials: "include" }).then((r) => r.json()),
      fetch("/api/auth/me", { credentials: "include" }).then((r) => r.json()),
    ])
      .then(([userRes, meRes]) => {
        if (!userRes.success) {
          setError(userRes.error ?? "Usuário não encontrado");
          setUsuario(null);
        } else {
          setUsuario(userRes.data as UsuarioDetalhe);
        }
        if (meRes.success && userRes.success) {
          const me = authMeUsuariosFromApi(meRes.data);
          const alvo = userRes.data as UsuarioDetalhe;
          setPodeEditar(canEditUsuarioClient(me, alvo));
          setPodeExcluir(canDeleteUsuarioClient(me, alvo));
        }
        setLoading(false);
      })
      .catch(() => {
        setError("Erro ao carregar dados");
        setLoading(false);
      });
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  function handleDelete() {
    if (!usuario) return;
    deleteConfirm.requestDelete(id, usuario.nome_completo, async () => {
      setDeleting(true);
      const res = await fetch(`/api/usuarios/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const json = await res.json();
      setDeleting(false);

      if (!json.success) {
        alert(json.error ?? "Não foi possível excluir");
        return;
      }
      router.push("/usuarios");
    });
  }

  return (
    <>
      <Header title="Detalhes do usuário" />
      <div className="page-content safe-bottom">
        <Link href="/usuarios" className="mb-4 inline-flex">
          <Button type="button" variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4" />
            Voltar à lista
          </Button>
        </Link>

        {loading && <p className="text-sm text-muted">Carregando...</p>}
        {error && !loading && (
          <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-950/40 dark:text-red-400">
            {error}
          </p>
        )}
        {usuario && !loading && (
          <UsuarioDetail
            usuario={usuario}
            podeEditar={podeEditar}
            podeExcluir={podeExcluir}
            onDelete={handleDelete}
            deleting={deleting}
          />
        )}
      </div>
      <ConfirmDialog {...deleteConfirm.dialogProps} />
    </>
  );
}
