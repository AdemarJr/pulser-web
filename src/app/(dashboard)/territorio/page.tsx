import { Header } from "@/components/layout/header";
import { ReferenciaExterna } from "@/components/territorio/referencia-externa";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TerritorioPage() {
  return (
    <>
      <Header title="Estados e municípios" />
      <div className="page-content space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Estados (UF)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted">
              <p>Lista usada nos cadastros. Origem recomendada: sincronização IBGE.</p>
              <code className="block rounded bg-slate-100 px-2 py-1 text-xs dark:bg-slate-800 dark:text-slate-200">
                GET/POST /api/territorio/estados
              </code>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Municípios</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted">
              <p>
                Cada município pertence a um estado. No banco: tabela{" "}
                <code className="text-xs">cidades</code>.
              </p>
              <code className="block rounded bg-slate-100 px-2 py-1 text-xs dark:bg-slate-800 dark:text-slate-200">
                GET /api/territorio/municipios?estado_id=
              </code>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card className="opacity-90">
            <CardHeader>
              <CardTitle className="text-base">Bairros</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted">
              Cadastro manual — não vem do IBGE nos formulários de eleitor.
            </CardContent>
          </Card>
          <Card className="opacity-90">
            <CardHeader>
              <CardTitle className="text-base">Zonas eleitorais</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted">
              Cadastro manual pela equipe administrativa.
            </CardContent>
          </Card>
        </div>

        <ReferenciaExterna />
      </div>
    </>
  );
}
