"use client";

type Permissao = {
  slug: string;
  nome: string;
  modulo: string;
};

type Props = {
  permissoes: Permissao[];
  perfilNome?: string;
};

export function PerfilPermissoesPanel({ permissoes, perfilNome }: Props) {
  const porModulo = permissoes.reduce<Record<string, Permissao[]>>((acc, p) => {
    const mod = p.modulo || "outros";
    acc[mod] = acc[mod] ?? [];
    acc[mod].push(p);
    return acc;
  }, {});

  if (permissoes.length === 0) {
    return (
      <p className="text-sm text-muted">
        Selecione um perfil para ver as permissões em cascata.
      </p>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-slate-50/80 p-4 dark:bg-slate-900/50">
      <p className="mb-3 text-sm font-medium text-foreground">
        Permissões do perfil{perfilNome ? `: ${perfilNome}` : ""}
      </p>
      <p className="mb-3 text-xs text-muted">
        Herdadas automaticamente pelo perfil (não editáveis por usuário).
      </p>
      <div className="space-y-3">
        {Object.entries(porModulo).map(([modulo, items]) => (
          <div key={modulo}>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">
              {modulo}
            </p>
            <ul className="flex flex-wrap gap-1.5">
              {items.map((p) => (
                <li
                  key={p.slug}
                  className="rounded-md bg-blue-100 px-2 py-0.5 text-xs text-blue-900 dark:bg-blue-950 dark:text-blue-200"
                  title={p.slug}
                >
                  {p.nome}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
