import { Header } from "@/components/layout/header";
import { RelatorioCard } from "@/components/relatorios/relatorio-card";
import { REPORT_META, REPORT_TIPOS } from "@/lib/relatorios/config";

export default function RelatoriosPage() {
  return (
    <>
      <Header title="Relatórios e exportações" />
      <div className="page-content">
        <p className="mb-6 text-sm text-muted">
          Exporte relatórios em PDF, Excel ou CSV. O escopo segue suas permissões:
          administradores veem todos os cadastros; demais perfis apenas os próprios.
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          {REPORT_TIPOS.map((tipo) => {
            const meta = REPORT_META[tipo];
            return (
              <RelatorioCard
                key={tipo}
                tipo={tipo}
                titulo={meta.titulo}
                descricao={meta.descricao}
                requerPeriodo={meta.requerPeriodo}
              />
            );
          })}
        </div>
      </div>
    </>
  );
}
