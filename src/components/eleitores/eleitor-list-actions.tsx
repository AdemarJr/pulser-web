"use client";

import Link from "next/link";
import { Eye, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Eleitor } from "@/types/database";
import type { AuthMe } from "@/lib/eleitores/client-permissions";
import { canDeleteEleitor, canEditEleitor } from "@/lib/eleitores/client-permissions";

type Props = {
  eleitor: Pick<Eleitor, "id" | "nome_completo" | "cadastrado_por">;
  auth: AuthMe | null;
  onDelete: (id: string, nome: string) => void;
  deletingId?: string | null;
  compact?: boolean;
};

export function EleitorListActions({
  eleitor,
  auth,
  onDelete,
  deletingId,
  compact,
}: Props) {
  const podeEditar = auth ? canEditEleitor(auth, eleitor) : false;
  const podeExcluir = auth ? canDeleteEleitor(auth, eleitor) : false;
  const deleting = deletingId === eleitor.id;

  return (
    <div
      className={`flex gap-1 ${compact ? "mt-3 border-t border-border pt-3" : ""}`}
      onClick={(e) => e.stopPropagation()}
    >
      <Link href={`/eleitores/${eleitor.id}`}>
        <Button type="button" size="sm" variant="outline" title="Visualizar">
          <Eye className="h-4 w-4" />
          {!compact && <span className="sr-only sm:not-sr-only sm:ml-1">Ver</span>}
        </Button>
      </Link>
      {podeEditar && (
        <Link href={`/eleitores/${eleitor.id}/editar`}>
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
          onClick={() => onDelete(eleitor.id, eleitor.nome_completo)}
        >
          <Trash2 className="h-4 w-4" />
          {!compact && <span className="sr-only sm:not-sr-only sm:ml-1">Excluir</span>}
        </Button>
      )}
    </div>
  );
}
