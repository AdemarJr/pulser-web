import { jsonError, jsonOk } from "@/lib/api/response";
import { listCampanhasPublicas } from "@/lib/portal/public-service";

export async function GET() {
  try {
    const campanhas = await listCampanhasPublicas();
    return jsonOk(campanhas);
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Erro ao listar campanhas", 500);
  }
}
