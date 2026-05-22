import { createClient } from "@/lib/supabase/server";
import { requireSession } from "@/lib/auth/session";
import { PERMISSIONS, hasPermission } from "@/lib/auth/permissions";
import { jsonError, jsonForbidden, jsonOk, jsonUnauthorized } from "@/lib/api/response";
import { z } from "zod";

const bodySchema = z.object({
  cidade_id: z.string().uuid("Município inválido"),
});

export async function PUT(request: Request) {
  try {
    const session = await requireSession();
    const podeCadastrar =
      hasPermission(session.permissions, PERMISSIONS.ELEITORES_CRIAR) ||
      hasPermission(session.permissions, PERMISSIONS.ELEITORES_EDITAR_PROPRIOS) ||
      hasPermission(session.permissions, PERMISSIONS.ELEITORES_EDITAR_TODOS);

    if (!podeCadastrar) return jsonForbidden();

    const body = await request.json();
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message ?? "Dados inválidos");
    }

    const supabase = await createClient();
    const { data: cidade } = await supabase
      .from("cidades")
      .select("id")
      .eq("id", parsed.data.cidade_id)
      .maybeSingle();

    if (!cidade) return jsonError("Município não encontrado", 404);

    const { data, error } = await supabase
      .from("usuarios")
      .update({ cidade_cadastro_padrao_id: parsed.data.cidade_id })
      .eq("id", session.user.id)
      .select("cidade_cadastro_padrao_id")
      .single();

    if (error) return jsonError(error.message, 500);
    return jsonOk(data);
  } catch {
    return jsonUnauthorized();
  }
}
