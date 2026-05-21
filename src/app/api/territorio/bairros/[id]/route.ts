import { createClient } from "@/lib/supabase/server";
import {
  handleTerritorioAuthError,
  mapDbError,
  requireTerritorioRead,
  requireTerritorioWrite,
} from "@/lib/api/territorio";
import { jsonError, jsonForbidden, jsonOk, jsonUnauthorized } from "@/lib/api/response";
import { bairroSchema } from "@/lib/validators/territorio";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    await requireTerritorioRead();
    const { id } = await params;
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("bairros")
      .select("*, cidade:cidades(id, nome, estado_id)")
      .eq("id", id)
      .single();

    if (error) return jsonError("Bairro não encontrado", 404);
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
    const parsed = bairroSchema.partial().safeParse(body);
    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message ?? "Dados inválidos");
    }
    if (Object.keys(parsed.data).length === 0) {
      return jsonError("Nenhum campo para atualizar");
    }

    const supabase = await createClient();

    if (parsed.data.cidade_id) {
      const { data: cidade } = await supabase
        .from("cidades")
        .select("id")
        .eq("id", parsed.data.cidade_id)
        .single();
      if (!cidade) return jsonError("Cidade não encontrada", 404);
    }

    const { data, error } = await supabase
      .from("bairros")
      .update(parsed.data)
      .eq("id", id)
      .select("*, cidade:cidades(id, nome, estado_id)")
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

    const { error } = await supabase.from("bairros").delete().eq("id", id);
    if (error) return jsonError(mapDbError(error.message), 500);
    return jsonOk({ deleted: true });
  } catch (e) {
    const auth = handleTerritorioAuthError(e);
    if (auth) return auth;
    if (e instanceof Error && e.message === "FORBIDDEN") return jsonForbidden();
    return jsonUnauthorized();
  }
}
