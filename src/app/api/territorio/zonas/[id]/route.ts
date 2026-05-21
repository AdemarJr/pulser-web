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

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    await requireTerritorioRead();
    const { id } = await params;
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("zonas_eleitorais")
      .select(
        "*, cidade:cidades(id, nome), estado:estados(id, nome, sigla)"
      )
      .eq("id", id)
      .single();

    if (error) return jsonError("Zona eleitoral não encontrada", 404);
    return jsonOk(data);
  } catch (e) {
    const auth = handleTerritorioAuthError(e);
    if (auth) return auth;
    return jsonUnauthorized();
  }
}

export async function PUT(request: Request, { params }: Params) {
  try {
    await requireTerritorioWrite();
    const { id } = await params;
    const body = await request.json();
    const parsed = zonaEleitoralSchema.partial().safeParse(body);
    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message ?? "Dados inválidos");
    }
    if (Object.keys(parsed.data).length === 0) {
      return jsonError("Nenhum campo para atualizar");
    }

    const supabase = await createClient();

    const { data: current } = await supabase
      .from("zonas_eleitorais")
      .select("cidade_id, estado_id")
      .eq("id", id)
      .single();

    if (!current) return jsonError("Zona eleitoral não encontrada", 404);

    const cidadeId = parsed.data.cidade_id ?? current.cidade_id;
    const estadoId = parsed.data.estado_id ?? current.estado_id;

    const mismatch = await assertCidadePertenceAoEstado(
      supabase,
      cidadeId,
      estadoId
    );
    if (mismatch) return jsonError(mismatch, 400);

    const { data, error } = await supabase
      .from("zonas_eleitorais")
      .update(parsed.data)
      .eq("id", id)
      .select(
        "*, cidade:cidades(id, nome), estado:estados(id, nome, sigla)"
      )
      .single();

    if (error) return jsonError(mapDbError(error.message), 500);
    return jsonOk(data);
  } catch (e) {
    const auth = handleTerritorioAuthError(e);
    if (auth) return auth;
    if (e instanceof Error && e.message === "FORBIDDEN") return jsonForbidden();
    return jsonUnauthorized();
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    await requireTerritorioWrite();
    const { id } = await params;
    const supabase = await createClient();

    const { error } = await supabase.from("zonas_eleitorais").delete().eq("id", id);
    if (error) return jsonError(mapDbError(error.message), 500);
    return jsonOk({ deleted: true });
  } catch (e) {
    const auth = handleTerritorioAuthError(e);
    if (auth) return auth;
    if (e instanceof Error && e.message === "FORBIDDEN") return jsonForbidden();
    return jsonUnauthorized();
  }
}
