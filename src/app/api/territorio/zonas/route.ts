import { createClient } from "@/lib/supabase/server";
import {
  assertCidadePertenceAoEstado,
  handleTerritorioAuthError,
  mapDbError,
  requireTerritorioRead,
  requireTerritorioWrite,
} from "@/lib/api/territorio";
import { jsonError, jsonForbidden, jsonOk, jsonUnauthorized } from "@/lib/api/response";
import { zonaEleitoralSchema } from "@/lib/validators/territorio";

export async function GET(request: Request) {
  try {
    await requireTerritorioRead();
    const { searchParams } = new URL(request.url);
    const supabase = await createClient();

    let query = supabase
      .from("zonas_eleitorais")
      .select(
        "*, cidade:cidades(id, nome), estado:estados(id, nome, sigla)",
        { count: "exact" }
      )
      .order("numero");

    const cidadeId = searchParams.get("cidade_id");
    const estadoId = searchParams.get("estado_id");
    if (cidadeId) query = query.eq("cidade_id", cidadeId);
    if (estadoId) query = query.eq("estado_id", estadoId);
    if (searchParams.get("numero")) {
      query = query.eq("numero", Number(searchParams.get("numero")));
    }

    const page = Number(searchParams.get("page") ?? 0);
    const limit = Math.min(Number(searchParams.get("limit") ?? 0), 100);
    if (page > 0 && limit > 0) {
      const from = (page - 1) * limit;
      query = query.range(from, from + limit - 1);
    }

    const { data, error, count } = await query;
    if (error) return jsonError(mapDbError(error.message), 500);

    if (page > 0 && limit > 0) {
      return jsonOk({ items: data, total: count, page, limit });
    }
    return jsonOk(data);
  } catch (e) {
    const auth = handleTerritorioAuthError(e);
    if (auth) return auth;
    return jsonUnauthorized();
  }
}

export async function POST(request: Request) {
  try {
    await requireTerritorioWrite();
    const body = await request.json();
    const parsed = zonaEleitoralSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message ?? "Dados inválidos");
    }

    const supabase = await createClient();
    const mismatch = await assertCidadePertenceAoEstado(
      supabase,
      parsed.data.cidade_id,
      parsed.data.estado_id
    );
    if (mismatch) return jsonError(mismatch, 400);

    const { data, error } = await supabase
      .from("zonas_eleitorais")
      .insert(parsed.data)
      .select(
        "*, cidade:cidades(id, nome), estado:estados(id, nome, sigla)"
      )
      .single();

    if (error) return jsonError(mapDbError(error.message), 500);
    return jsonOk(data, 201);
  } catch (e) {
    const auth = handleTerritorioAuthError(e);
    if (auth) return auth;
    if (e instanceof Error && e.message === "FORBIDDEN") return jsonForbidden();
    return jsonUnauthorized();
  }
}
