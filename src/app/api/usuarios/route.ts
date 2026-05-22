import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/server";
import { requireSession } from "@/lib/auth/session";
import {
  canAssignPerfilId,
  canManageUsuarios,
  canViewAllUsuariosEquipe,
  canViewUsuarios,
  slugPerfilUsuario,
} from "@/lib/auth/usuarios-access";
import { podeVisualizarUsuario } from "@/lib/auth/perfil-hierarquia";
import { fetchUsuariosLista } from "@/lib/usuarios/fetch-list";
import {
  USUARIO_LIST_SELECT,
  USUARIO_LIST_SELECT_SEM_CRIADOR,
  isUsuarioCriadorEmbedError,
} from "@/lib/usuarios/select-fields";
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

    const supabase = canViewAllUsuariosEquipe(session)
      ? await createServiceClient()
      : await createClient();
    const { data, error } = await fetchUsuariosLista(supabase);

    if (error) return jsonError(error.message, 500);

    const slugAtor = session.profile.perfil?.slug ?? "";
    const lista = data ?? [];
    const filtrados = canViewAllUsuariosEquipe(session)
      ? lista
      : lista.filter((u) =>
          podeVisualizarUsuario(
            slugAtor,
            slugPerfilUsuario(u),
            u.id === session.user.id
          )
        );

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

    const row = {
      id: authUser.user.id,
      nome_completo: parsed.data.nome_completo,
      email: parsed.data.email,
      telefone: parsed.data.telefone || null,
      cpf: parsed.data.cpf || null,
      perfil_id: parsed.data.perfil_id,
      status: parsed.data.status,
      criado_por: session.user.id,
    };

    const { error: insertError } = await service.from("usuarios").insert(row);
    if (insertError) return jsonError(insertError.message, 500);

    let fetched = await service
      .from("usuarios")
      .select(USUARIO_LIST_SELECT)
      .eq("id", authUser.user.id)
      .single();

    if (
      fetched.error &&
      isUsuarioCriadorEmbedError(fetched.error.message)
    ) {
      fetched = await service
        .from("usuarios")
        .select(USUARIO_LIST_SELECT_SEM_CRIADOR)
        .eq("id", authUser.user.id)
        .single();
    }

    if (fetched.error) return jsonError(fetched.error.message, 500);
    return jsonOk(fetched.data, 201);
  } catch {
    return jsonUnauthorized();
  }
}
