import { createClient } from "@/lib/supabase/server";
import { requireSession } from "@/lib/auth/session";
import { PERMISSIONS, hasPermission } from "@/lib/auth/permissions";
import { jsonError, jsonForbidden, jsonOk, jsonUnauthorized } from "@/lib/api/response";

type Params = { params: Promise<{ id: string }> };

export async function POST(_req: Request, { params }: Params) {
  try {
    const session = await requireSession();
    if (!hasPermission(session.permissions, PERMISSIONS.PORTAL_GERENCIAR)) {
      return jsonForbidden();
    }

    const { id } = await params;
    const supabase = await createClient();

    const { count } = await supabase
      .from("perguntas")
      .select("*", { count: "exact", head: true })
      .eq("formulario_id", id);

    if (!count || count < 1) {
      return jsonError("Adicione ao menos uma pergunta antes de publicar");
    }

    const { data, error } = await supabase
      .from("formularios")
      .update({ status: "publicado", publicado_em: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) return jsonError(error.message, 500);
    return jsonOk(data);
  } catch {
    return jsonUnauthorized();
  }
}
