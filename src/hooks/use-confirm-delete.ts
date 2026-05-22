"use client";

import { useCallback, useState } from "react";

type DeleteTarget = {
  id: string;
  nome: string;
  onConfirm: () => void | Promise<void>;
};

export function useConfirmDelete(entityLabel = "registro") {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [target, setTarget] = useState<DeleteTarget | null>(null);

  const requestDelete = useCallback(
    (id: string, nome: string, onConfirm: () => void | Promise<void>) => {
      setTarget({ id, nome, onConfirm });
      setOpen(true);
    },
    []
  );

  const handleConfirm = useCallback(async () => {
    if (!target) return;
    setLoading(true);
    try {
      await target.onConfirm();
      setOpen(false);
      setTarget(null);
    } finally {
      setLoading(false);
    }
  }, [target]);

  const dialogProps = {
    open,
    onOpenChange: (v: boolean) => {
      if (!loading) {
        setOpen(v);
        if (!v) setTarget(null);
      }
    },
    title: `Excluir ${entityLabel}?`,
    description: target
      ? `Deseja excluir "${target.nome}"? Esta ação não pode ser desfeita.`
      : "",
    confirmLabel: "Excluir",
    cancelLabel: "Cancelar",
    onConfirm: handleConfirm,
    loading,
    variant: "destructive" as const,
  };

  return { requestDelete, dialogProps, isOpen: open };
}
