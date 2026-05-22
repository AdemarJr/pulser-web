"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Header } from "@/components/layout/header";
import { Button } from "@/components/ui/button";
import { UsuarioForm } from "@/components/usuarios/usuario-form";
import {
  authMeUsuariosFromApi,
  canManageUsuariosList,
} from "@/lib/usuarios/client-permissions";

export default function NovoUsuarioPage() {
  const router = useRouter();
  const [allowed, setAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    fetch("/api/auth/me", { credentials: "include" })
      .then((r) => r.json())
      .then((j) => {
        if (!j.success) {
          setAllowed(false);
          return;
        }
        const me = authMeUsuariosFromApi(j.data);
        setAllowed(canManageUsuariosList(me));
      })
      .catch(() => setAllowed(false));
  }, []);

  if (allowed === null) {
    return (
      <>
        <Header title="Novo usuário" />
        <div className="page-content">
          <p className="text-sm text-muted">Carregando...</p>
        </div>
      </>
    );
  }

  if (!allowed) {
    return (
      <>
        <Header title="Novo usuário" />
        <div className="page-content">
          <Link href="/usuarios" className="mb-4 inline-flex">
            <Button type="button" variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
          </Link>
          <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600 dark:bg-red-950/40 dark:text-red-400">
            Você não tem permissão para criar usuários.
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      <Header title="Novo usuário" />
      <div className="page-content safe-bottom">
        <Link href="/usuarios" className="mb-4 inline-flex">
          <Button type="button" variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4" />
            Voltar à lista
          </Button>
        </Link>
        <UsuarioForm
          mode="create"
          onCancel={() => router.push("/usuarios")}
          onSuccess={(id) => router.push(`/usuarios/${id}`)}
        />
      </div>
    </>
  );
}
