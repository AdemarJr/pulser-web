import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import {
  handleTerritorioAuthError,
  mapDbError,
  requireTerritorioWrite,
} from "@/lib/api/territorio";
import { syncEstadosEMunicipiosFromIbge } from "@/lib/externos/sync-ibge";
import { jsonError, jsonForbidden, jsonOk, jsonUnauthorized } from "@/lib/api/response";

const syncIbgeSchema = z.object({
  ufs: z.array(z.string().length(2)).optional(),
});

/** Importa estados (UF) e municípios do IBGE para os cadastros do sistema. */
export async function POST(request: Request) {
  try {
    await requireTerritorioWrite();
    const body = await request.json().catch(() => ({}));
    const parsed = syncIbgeSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message ?? "Dados inválidos");
    }

    const supabase = await createClient();
    const result = await syncEstadosEMunicipiosFromIbge(supabase, parsed.data);
    return jsonOk(result);
  } catch (e) {
    const auth = handleTerritorioAuthError(e);
    if (auth) return auth;
    if (e instanceof Error && e.message === "FORBIDDEN") return jsonForbidden();
    if (e instanceof Error) {
      return jsonError(mapDbError(e.message), 500);
    }
    return jsonUnauthorized();
  }
}
