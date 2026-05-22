import { jsonError, jsonOk } from "@/lib/api/response";
import { getFormularioPublico, getResultadosPublicos } from "@/lib/portal/public-service";

type Params = { params: Promise<{ slug: string; formSlug: string }> };

export async function GET(request: Request, { params }: Params) {
  try {
    const { slug, formSlug } = await params;
    const dados = await getFormularioPublico(slug, formSlug);
    if (!dados) return jsonError("Formulário não encontrado", 404);

    const url = new URL(request.url);
    const comResultados = url.searchParams.get("resultados") === "1";
    const mostrar =
      comResultados &&
      dados.formulario.config?.mostrar_resultados_publicos === true;

    let resultados = null;
    if (mostrar) {
      resultados = await getResultadosPublicos(dados.formulario.id);
    }

    return jsonOk({ ...dados, resultados });
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Erro", 500);
  }
}
