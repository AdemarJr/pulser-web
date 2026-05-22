"use client";

import Link from "next/link";
import { Eye, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AuthMeUsuarios } from "@/lib/usuarios/client-permissions";
import {
  canDeleteUsuarioClient,
  canEditUsuarioClient,
} from "@/lib/usuarios/client-permissions";

type UsuarioRow = {
  id: string;
  nome_completo: string;
  perfil?: { slug: string } | null;
};

type Props = {
  usuario: UsuarioRow;
  auth: AuthMeUsuarios | null;
  onDelete: (id: string, nome: string) => void;
  deletingId?: string | null;
  compact?: boolean;
};

export function UsuarioListActions({
  usuario,
  auth,
  onDelete,
  deletingId,
  compact,
}: Props) {
  const podeEditar = auth ? canEditUsuarioClient(auth, usuario) : false;
  const podeExcluir = auth ? canDeleteUsuarioClient(auth, usuario) : false;
  const deleting = deletingId === usuario.id;

  return (
    <div
      className={`flex gap-1 ${compact ? "mt-3 border-t border-border pt-3" : ""}`}
      onClick={(e) => e.stopPropagation()}
    >
      <Link href={`/usuarios/${usuario.id}`}>
        <Button type="button" size="sm" variant="outline" title="Visualizar">
          <Eye className="h-4 w-4" />
          {!compact && <span className="sr-only sm:not-sr-only sm:ml-1">Ver</span>}
        </Button>
      </Link>
      {podeEditar && (
        <Link href={`/usuarios/${usuario.id}/editar`}>
          <Button type="button" size="sm" variant="outline" title="Editar">
            <Pencil className="h-4 w-4" />
            {!compact && <span className="sr-only sm:not-sr-only sm:ml-1">Editar</span>}
          </Button>
        </Link>
      )}
      {podeExcluir && (
        <Button
          type="button"
          size="sm"
          variant="destructive"
          title="Excluir"
          disabled={deleting}
          onClick={() => onDelete(usuario.id, usuario.nome_completo)}
        >
          <Trash2 className="h-4 w-4" />
          {!compact && <span className="sr-only sm:not-sr-only sm:ml-1">Excluir</span>}
        </Button>
      )}
    </div>
  );
}
