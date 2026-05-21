import { getIbgeMunicipiosPorUf } from "@/lib/externos/ibge";
import { handleTerritorioAuthError, requireTerritorioRead } from "@/lib/api/territorio";
import { jsonError, jsonOk, jsonUnauthorized } from "@/lib/api/response";

type Params = { params: Promise<{ uf: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    await requireTerritorioRead();
    const { uf } = await params;
    const data = await getIbgeMunicipiosPorUf(uf);
    return jsonOk({
      fonte: "ibge",
      uf: uf.toUpperCase(),
      total: data.length,
      items: data,
    });
  } catch (e) {
    const auth = handleTerritorioAuthError(e);
    if (auth) return auth;
    if (e instanceof Error) return jsonError(e.message, 502);
    return jsonUnauthorized();
  }
}
