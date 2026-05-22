import { createClient } from "@/lib/supabase/server";
import { requireSession } from "@/lib/auth/session";
import { PERMISSIONS, hasPermission } from "@/lib/auth/permissions";
import { jsonError, jsonForbidden, jsonOk, jsonUnauthorized } from "@/lib/api/response";
import { perguntaCreateSchema } from "@/lib/validators/portal";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  try {
    const session = await requireSession();
    if (!hasPermission(session.permissions, PERMISSIONS.PORTAL_GERENCIAR)) {
      return jsonForbidden();
    }

    const { id: formularioId } = await params;
    const body = await request.json();
    const parsed = perguntaCreateSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message ?? "Dados inválidos");
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("perguntas")
      .insert({
        formulario_id: formularioId,
        texto: parsed.data.texto,
        tipo: parsed.data.tipo,
        ordem: parsed.data.ordem,
        obrigatoria: parsed.data.obrigatoria,
        opcoes: parsed.data.opcoes,
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
