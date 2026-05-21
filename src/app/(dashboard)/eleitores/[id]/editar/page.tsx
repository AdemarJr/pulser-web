"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { EleitorForm } from "@/components/eleitores/eleitor-form";
import { eleitorToFormInput } from "@/lib/eleitores/to-form";
import type { EleitorFormInput } from "@/lib/validators/eleitor";
import type { Eleitor } from "@/types/database";
import type { AuthMe } from "@/lib/eleitores/client-permissions";
import { canEditEleitor } from "@/lib/eleitores/client-permissions";

export default function EditarEleitorPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [initialValues, setInitialValues] = useState<EleitorFormInput | undefined>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      fetch(`/api/eleitores/${id}`, { credentials: "include" }).then((r) => r.json()),
      fetch("/api/auth/me", { credentials: "include" }).then((r) => r.json()),
    ])
      .then(([eleitorRes, meRes]) => {
        if (!eleitorRes.success) {
          setError(eleitorRes.error ?? "Eleitor não encontrado");
          setLoading(false);
          return;
        }

        const eleitor = eleitorRes.data as Eleitor;
        const me: AuthMe | null = meRes.success
          ? {
              user: { id: meRes.data.user.id },
              permissions: meRes.data.permissions ?? [],
              canViewAllEleitores: meRes.data.canViewAllEleitores === true,
            }
          : null;

        if (me && !canEditEleitor(me, eleitor)) {
          setError("Você não tem permissão para editar este cadastro.");
          setLoading(false);
          return;
        }

        setInitialValues(eleitorToFormInput(eleitor));
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
        <Header title="Editar eleitor" />
        <div className="page-content">
          <p className="text-sm text-muted">Carregando...</p>
        </div>
      </>
    );
  }

  if (error || !initialValues) {
    return (
      <>
        <Header title="Editar eleitor" />
        <div className="page-content">
          <Link href={`/eleitores/${id}`} className="mb-4 inline-flex">
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
      <Header title="Editar eleitor" />
      <div className="page-content safe-bottom">
        <Link href={`/eleitores/${id}`} className="mb-4 inline-flex">
          <Button type="button" variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4" />
            Ver cadastro
          </Button>
        </Link>
        <EleitorForm
          mode="edit"
          eleitorId={id}
          initialValues={initialValues}
          onCancel={() => router.push(`/eleitores/${id}`)}
          onSuccess={() => router.push(`/eleitores/${id}`)}
        />
      </div>
    </>
  );
}
