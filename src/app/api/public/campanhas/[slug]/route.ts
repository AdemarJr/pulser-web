import { jsonError, jsonOk } from "@/lib/api/response";
import { getCampanhaPublica } from "@/lib/portal/public-service";

type Params = { params: Promise<{ slug: string }> };

export async function GET(_req: Request, { params }: Params) {
  try {
    const { slug } = await params;
    const campanha = await getCampanhaPublica(slug);
    if (!campanha) return jsonError("Campanha não encontrada", 404);
    return jsonOk(campanha);
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Erro", 500);
  }
}
