"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { EleitorDetail } from "@/components/eleitores/eleitor-detail";
import { ConfirmDialog } from "@/components/ui/action-dialog";
import { useConfirmDelete } from "@/hooks/use-confirm-delete";
import type { AuthMe } from "@/lib/eleitores/client-permissions";
import type { Eleitor } from "@/types/database";

export default function EleitorDetalhePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [eleitor, setEleitor] = useState<Eleitor | null>(null);
  const [auth, setAuth] = useState<AuthMe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(false);
  const deleteConfirm = useConfirmDelete("eleitor");

  const load = useCallback(() => {
    setLoading(true);
    setError("");
    Promise.all([
      fetch(`/api/eleitores/${id}`, { credentials: "include" }).then((r) => r.json()),
      fetch("/api/auth/me", { credentials: "include" }).then((r) => r.json()),
    ])
      .then(([eleitorRes, meRes]) => {
        if (!eleitorRes.success) {
          setError(eleitorRes.error ?? "Eleitor não encontrado");
          setEleitor(null);
        } else {
          setEleitor(eleitorRes.data);
        }
        if (meRes.success) {
          setAuth({
            user: { id: meRes.data.user.id },
            permissions: meRes.data.permissions ?? [],
            canViewAllEleitores: meRes.data.canViewAllEleitores === true,
          });
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
    if (!eleitor) return;
    deleteConfirm.requestDelete(id, eleitor.nome_completo, async () => {
      setDeleting(true);
      const res = await fetch(`/api/eleitores/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const json = await res.json();
      setDeleting(false);

      if (!json.success) {
        alert(json.error ?? "Não foi possível excluir");
        return;
      }
      router.push("/eleitores");
    });
  }

  return (
    <>
      <Header title="Detalhes do eleitor" />
      <div className="page-content safe-bottom">
        <Link href="/eleitores" className="mb-4 inline-flex">
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
        {eleitor && auth && !loading && (
          <EleitorDetail
            eleitor={eleitor}
            auth={auth}
            onDelete={handleDelete}
            deleting={deleting}
          />
        )}
      </div>
      <ConfirmDialog {...deleteConfirm.dialogProps} />
    </>
  );
}
