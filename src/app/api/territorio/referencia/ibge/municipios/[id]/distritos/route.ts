import { getIbgeDistritosPorMunicipio } from "@/lib/externos/ibge";
import { handleTerritorioAuthError, requireTerritorioRead } from "@/lib/api/territorio";
import { jsonError, jsonOk, jsonUnauthorized } from "@/lib/api/response";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    await requireTerritorioRead();
    const { id } = await params;
    const municipioIbgeId = Number(id);
    if (!Number.isFinite(municipioIbgeId)) {
      return jsonError("ID do município IBGE inválido");
    }

    const data = await getIbgeDistritosPorMunicipio(municipioIbgeId);
    return jsonOk({
      fonte: "ibge",
      municipio_ibge_id: municipioIbgeId,
      total: data.length,
      items: data,
      observacao:
        "Distritos IBGE não são usados nos cadastros de eleitores (apenas estados e municípios).",
    });
  } catch (e) {
    const auth = handleTerritorioAuthError(e);
    if (auth) return auth;
    if (e instanceof Error) return jsonError(e.message, 502);
    return jsonUnauthorized();
  }
}
