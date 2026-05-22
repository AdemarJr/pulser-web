import { PortalHeader } from "@/components/portal/portal-header";

export const metadata = {
  title: "Portal de Participação",
  description: "Enquetes, pesquisas e consultas públicas PULSE",
};

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-full flex-col bg-background">
      <PortalHeader />
      <main className="flex-1 px-4 py-8 sm:px-6">{children}</main>
      <footer className="border-t border-border py-6 text-center text-xs text-muted">
        PULSE — participação cidadã. Dados tratados de forma anônima (LGPD).
      </footer>
    </div>
  );
}
