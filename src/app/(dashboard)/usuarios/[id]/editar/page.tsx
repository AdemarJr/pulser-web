"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { UsuarioForm } from "@/components/usuarios/usuario-form";
import { usuarioToFormInput } from "@/lib/usuarios/to-form";
import {
  authMeUsuariosFromApi,
  canEditUsuarioClient,
} from "@/lib/usuarios/client-permissions";
import type { UsuarioUpdateInput } from "@/lib/validators/usuario";

export default function EditarUsuarioPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [initialValues, setInitialValues] = useState<UsuarioUpdateInput | undefined>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      fetch(`/api/usuarios/${id}`, { credentials: "include" }).then((r) => r.json()),
      fetch("/api/auth/me", { credentials: "include" }).then((r) => r.json()),
    ])
      .then(([userRes, meRes]) => {
        if (!userRes.success) {
          setError(userRes.error ?? "Usuário não encontrado");
          setLoading(false);
          return;
        }

        const u = userRes.data;
        if (meRes.success) {
          const me = authMeUsuariosFromApi(meRes.data);
          if (!canEditUsuarioClient(me, u)) {
            setError("Você não tem permissão para editar este usuário.");
            setLoading(false);
            return;
          }
        }

        setInitialValues(usuarioToFormInput(u));
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

  if (loading) {
    return (
      <>
        <Header title="Editar usuário" />
        <div className="page-content">
          <p className="text-sm text-muted">Carregando...</p>
        </div>
      </>
    );
  }

  if (error || !initialValues) {
    return (
      <>
        <Header title="Editar usuário" />
        <div className="page-content">
          <Link href={`/usuarios/${id}`} className="mb-4 inline-flex">
            <Button type="button" variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
          </Link>
          <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-950/40 dark:text-red-400">
            {error ?? "Dados indisponíveis"}
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      <Header title="Editar usuário" />
      <div className="page-content safe-bottom">
        <Link href={`/usuarios/${id}`} className="mb-4 inline-flex">
          <Button type="button" variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4" />
            Ver usuário
          </Button>
        </Link>
        <UsuarioForm
          mode="edit"
          userId={id}
          initialValues={initialValues}
          onCancel={() => router.push(`/usuarios/${id}`)}
          onSuccess={() => router.push(`/usuarios/${id}`)}
        />
      </div>
    </>
  );
}
