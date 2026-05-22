import { createClient } from "@/lib/supabase/server";
import { requireSession } from "@/lib/auth/session";
import { PERMISSIONS, hasPermission } from "@/lib/auth/permissions";
import { jsonError, jsonForbidden, jsonOk, jsonUnauthorized } from "@/lib/api/response";
import { formularioCreateSchema } from "@/lib/validators/portal";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  try {
    const session = await requireSession();
    if (!hasPermission(session.permissions, PERMISSIONS.PORTAL_GERENCIAR)) {
      return jsonForbidden();
    }

    const { id: campanhaId } = await params;
    const body = await request.json();
    const parsed = formularioCreateSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message ?? "Dados inválidos");
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("formularios")
      .insert({
        campanha_id: campanhaId,
        slug: parsed.data.slug,
        tipo: parsed.data.tipo,
        titulo: parsed.data.titulo,
        descricao: parsed.data.descricao || null,
        ordem: parsed.data.ordem,
        config: parsed.data.config ?? {},
      })
      .select()
      .single();

    if (error) return jsonError(error.message, 500);
    return jsonOk(data, 201);
  } catch {
    return jsonUnauthorized();
  }
}
