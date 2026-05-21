import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/server";
import { requireSession } from "@/lib/auth/session";
import { PERMISSIONS, hasPermission } from "@/lib/auth/permissions";
import { usuarioSchema } from "@/lib/validators/eleitor";
import {
  jsonError,
  jsonForbidden,
  jsonOk,
  jsonUnauthorized,
} from "@/lib/api/response";

export async function GET() {
  try {
    const session = await requireSession();
    if (!hasPermission(session.permissions, PERMISSIONS.USUARIOS_VISUALIZAR)) {
      return jsonForbidden();
    }
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("usuarios")
      .select("*, perfil:perfis(nome, slug)")
      .order("nome_completo");
    if (error) return jsonError(error.message, 500);
    return jsonOk(data);
  } catch {
    return jsonUnauthorized();
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    if (!hasPermission(session.permissions, PERMISSIONS.USUARIOS_GERENCIAR)) {
      return jsonForbidden();
    }

    const body = await request.json();
    const parsed = usuarioSchema.safeParse(body);
    if (!parsed.success || !parsed.data.password) {
      return jsonError("Dados inválidos ou senha obrigatória");
    }

    const service = await createServiceClient();
    const { data: authUser, error: authError } =
      await service.auth.admin.createUser({
        email: parsed.data.email,
        password: parsed.data.password,
        email_confirm: true,
      });

    if (authError) return jsonError(authError.message, 500);

    const { data, error } = await service.from("usuarios").insert({
      id: authUser.user.id,
      nome_completo: parsed.data.nome_completo,
      email: parsed.data.email,
      telefone: parsed.data.telefone,
      cpf: parsed.data.cpf,
      perfil_id: parsed.data.perfil_id,
      status: parsed.data.status,
    }).select("*, perfil:perfis(*)").single();

    if (error) return jsonError(error.message, 500);
    return jsonOk(data, 201);
  } catch {
    return jsonUnauthorized();
  }
}
