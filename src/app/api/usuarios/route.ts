import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/server";
import { requireSession } from "@/lib/auth/session";
import {
  canAssignPerfilId,
  canManageUsuarios,
  canViewUsuario,
  canViewUsuarios,
} from "@/lib/auth/usuarios-access";
import { podeVisualizarUsuario } from "@/lib/auth/perfil-hierarquia";
import { usuarioCreateSchema } from "@/lib/validators/usuario";
import {
  jsonError,
  jsonForbidden,
  jsonOk,
  jsonUnauthorized,
} from "@/lib/api/response";

export async function GET() {
  try {
    const session = await requireSession();
    if (!canViewUsuarios(session)) return jsonForbidden();

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("usuarios")
      .select(
        "*, perfil:perfis(id, slug, nome, descricao), criador:usuarios!criado_por(nome_completo)"
      )
      .order("nome_completo");

    if (error) return jsonError(error.message, 500);

    const slugAtor = session.profile.perfil?.slug ?? "";
    const filtrados = (data ?? []).filter((u) => {
      const slug = (u.perfil as { slug: string } | null)?.slug ?? "";
      return podeVisualizarUsuario(
        slugAtor,
        slug,
        u.id === session.user.id
      );
    });

    return jsonOk(filtrados);
  } catch {
    return jsonUnauthorized();
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    if (!canManageUsuarios(session)) return jsonForbidden();

    const body = await request.json();
    const parsed = usuarioCreateSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError(parsed.error.issues[0]?.message ?? "Dados inválidos");
    }

    const supabase = await createClient();
    const { data: perfilAlvo } = await supabase
      .from("perfis")
      .select("slug")
      .eq("id", parsed.data.perfil_id)
      .single();

    if (!perfilAlvo || !canAssignPerfilId(session, perfilAlvo.slug)) {
      return jsonError("Você não pode atribuir este perfil (hierarquia).", 403);
    }

    const service = await createServiceClient();
    const { data: authUser, error: authError } =
      await service.auth.admin.createUser({
        email: parsed.data.email,
        password: parsed.data.password,
        email_confirm: true,
        user_metadata: { nome_completo: parsed.data.nome_completo },
      });

    if (authError) return jsonError(authError.message, 500);

    const { data, error } = await service
      .from("usuarios")
      .insert({
        id: authUser.user.id,
        nome_completo: parsed.data.nome_completo,
        email: parsed.data.email,
        telefone: parsed.data.telefone || null,
        cpf: parsed.data.cpf || null,
        perfil_id: parsed.data.perfil_id,
        status: parsed.data.status,
        criado_por: session.user.id,
      })
      .select("*, perfil:perfis(id, slug, nome, descricao), criador:usuarios!criado_por(nome_completo)")
      .single();

    if (error) return jsonError(error.message, 500);
    return jsonOk(data, 201);
  } catch {
    return jsonUnauthorized();
  }
}
