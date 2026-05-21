"use client";

import { useEffect, useState } from "react";
import { Header } from "@/components/layout/header";
import { Card, CardContent } from "@/components/ui/card";
import type { Usuario } from "@/types/database";

function UsuarioCard({ u }: { u: Usuario }) {
  const perfil = (u.perfil as { nome: string } | undefined)?.nome ?? "-";

  return (
    <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
      <p className="font-semibold text-foreground">{u.nome_completo}</p>
      <p className="mt-1 truncate text-sm text-muted">{u.email}</p>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
        <span className="rounded-full bg-slate-100 px-2 py-0.5 font-medium text-foreground dark:bg-slate-800">
          {perfil}
        </span>
        <span className="rounded-full bg-indigo-100 px-2 py-0.5 font-medium capitalize text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-200">
          {u.status}
        </span>
      </div>
    </div>
  );
}

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/usuarios")
      .then((r) => r.json())
      .then((j) => {
        if (j.success) setUsuarios(j.data);
        setLoading(false);
      });
  }, []);

  return (
    <>
      <Header title="Usuários" />
      <div className="page-content">
        <div className="space-y-3 lg:hidden">
          {loading ? (
            <p className="py-8 text-center text-sm text-muted">Carregando...</p>
          ) : usuarios.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted">Nenhum usuário.</p>
          ) : (
            usuarios.map((u) => <UsuarioCard key={u.id} u={u} />)
          )}
        </div>

        <Card className="hidden lg:block">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-slate-100 dark:bg-slate-800">
                  <tr>
                    <th className="px-4 py-3 text-left">Nome</th>
                    <th className="px-4 py-3 text-left">E-mail</th>
                    <th className="px-4 py-3 text-left">Perfil</th>
                    <th className="px-4 py-3 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-muted">
                        Carregando...
                      </td>
                    </tr>
                  ) : (
                    usuarios.map((u) => (
                      <tr
                        key={u.id}
                        className="border-b border-border hover:bg-slate-50 dark:hover:bg-slate-800/50"
                      >
                        <td className="px-4 py-3 font-medium">{u.nome_completo}</td>
                        <td className="px-4 py-3">{u.email}</td>
                        <td className="px-4 py-3">
                          {(u.perfil as { nome: string } | undefined)?.nome ?? "-"}
                        </td>
                        <td className="px-4 py-3 capitalize">{u.status}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
