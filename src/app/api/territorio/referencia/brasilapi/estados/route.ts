import { getBrasilApiEstados } from "@/lib/externos/brasilapi";
import { handleTerritorioAuthError, requireTerritorioRead } from "@/lib/api/territorio";
import { jsonError, jsonOk, jsonUnauthorized } from "@/lib/api/response";

export async function GET() {
  try {
    await requireTerritorioRead();
    const data = await getBrasilApiEstados();
    return jsonOk({ fonte: "brasilapi", total: data.length, items: data });
  } catch (e) {
    const auth = handleTerritorioAuthError(e);
    if (auth) return auth;
    if (e instanceof Error) return jsonError(e.message, 502);
    return jsonUnauthorized();
  }
}
