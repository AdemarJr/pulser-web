import { Header } from "@/components/layout/header";

type Props = {
  title: string;
  children: React.ReactNode;
  /** Espaço extra no rodapé (formulários longos no mobile) */
  safeBottom?: boolean;
};

/** Estrutura padrão: header fixo no topo da rolagem + conteúdo */
export function PageShell({ title, children, safeBottom }: Props) {
  return (
    <div className="flex min-h-0 min-w-0 flex-col">
      <Header title={title} />
      <div className={safeBottom ? "page-content safe-bottom" : "page-content"}>
        {children}
      </div>
    </div>
  );
}
