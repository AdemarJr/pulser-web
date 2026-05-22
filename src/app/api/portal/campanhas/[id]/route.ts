import { createClient } from "@/lib/supabase/server";
import { requireSession } from "@/lib/auth/session";
import { PERMISSIONS, hasPermission } from "@/lib/auth/permissions";
import { jsonError, jsonForbidden, jsonOk, jsonUnauthorized } from "@/lib/api/response";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  try {
    const session = await requireSession();
    if (
      !hasPermission(session.permissions, PERMISSIONS.PORTAL_VISUALIZAR) &&
      !hasPermission(session.permissions, PERMISSIONS.PORTAL_GERENCIAR)
    ) {
      return jsonForbidden();
    }

    const { id } = await params;
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("campanhas")
      .select("*, formularios(*, perguntas(*))")
      .eq("id", id)
      .maybeSingle();

    if (error) return jsonError(error.message, 500);
    if (!data) return jsonError("Campanha não encontrada", 404);
    return jsonOk(data);
  } catch {
    return jsonUnauthorized();
  }
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const session = await requireSession();
    if (!hasPermission(session.permissions, PERMISSIONS.PORTAL_GERENCIAR)) {
      return jsonForbidden();
    }

    const { id } = await params;
    const body = await request.json();
    const updates: Record<string, unknown> = {};

    if (body.status === "publicado") {
      updates.status = "publicado";
      updates.publicado_em = new Date().toISOString();
    } else if (body.status === "encerrado") {
      updates.status = "encerrado";
      updates.encerrada_em = new Date().toISOString();
    } else if (body.status === "rascunho") {
      updates.status = "rascunho";
    }

    if (body.titulo) updates.titulo = body.titulo;
    if (body.descricao !== undefined) updates.descricao = body.descricao;

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("campanhas")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) return jsonError(error.message, 500);
    return jsonOk(data);
  } catch {
    return jsonUnauthorized();
  }
}
