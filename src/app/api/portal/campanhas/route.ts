import { createClient } from "@/lib/supabase/server";
import { requireSession } from "@/lib/auth/session";
import { PERMISSIONS, hasPermission } from "@/lib/auth/permissions";
import { jsonError, jsonForbidden, jsonOk, jsonUnauthorized } from "@/lib/api/response";
import { campanhaCreateSchema } from "@/lib/validators/portal";

export async function GET() {
  try {
    const session = await requireSession();
    if (
      !hasPermission(session.permissions, PERMISSIONS.PORTAL_VISUALIZAR) &&
      !hasPermission(session.permissions, PERMISSIONS.PORTAL_GERENCIAR)
    ) {
      return jsonForbidden();
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("campanhas")
      .select("*, formularios(id, slug, tipo, titulo, status, ordem)")
      .order("created_at", { ascending: false });

    if (error) return jsonError(error.message, 500);
    return jsonOk(data ?? []);
  } catch {
    return jsonUnauthorized();
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    if (!hasPermission(session.permissions, PERMISSIONS.PORTAL_GERENCIAR)) {
      return jsonForbidden();
    }

    const body = await request.json();
    const parsed = campanhaCreateSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message ?? "Dados inválidos");
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("campanhas")
      .insert({
        slug: parsed.data.slug,
        titulo: parsed.data.titulo,
        descricao: parsed.data.descricao || null,
        imagem_url: parsed.data.imagem_url || null,
        criado_por: session.user.id,
      })
      .select()
      .single();

    if (error) return jsonError(error.message, 500);
    return jsonOk(data, 201);
  } catch {
    return jsonUnauthorized();
  }
}
