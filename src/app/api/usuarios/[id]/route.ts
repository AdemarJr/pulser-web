import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import type { AuthSession } from "@/lib/auth/session";
import { requireSession } from "@/lib/auth/session";
import {
  canAssignPerfilId,
  canDeleteUsuario,
  canEditUsuario,
  canViewAllUsuariosEquipe,
  canViewUsuario,
} from "@/lib/auth/usuarios-access";
import {
  USUARIO_DETAIL_SELECT,
  USUARIO_DETAIL_SELECT_SEM_CRIADOR,
  isUsuarioCriadorEmbedError,
} from "@/lib/usuarios/select-fields";
import { usuarioUpdateSchema } from "@/lib/validators/usuario";
import {
  jsonError,
  jsonForbidden,
  jsonOk,
  jsonUnauthorized,
} from "@/lib/api/response";

type Params = { params: Promise<{ id: string }> };

async function fetchUsuario(id: string, supabase: SupabaseClient) {
  let result = await supabase
    .from("usuarios")
    .select(USUARIO_DETAIL_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (
    result.error &&
    isUsuarioCriadorEmbedError(result.error.message)
  ) {
    result = await supabase
      .from("usuarios")
      .select(USUARIO_DETAIL_SELECT_SEM_CRIADOR)
      .eq("id", id)
      .maybeSingle();
  }

  return result;
}

async function clientForUsuariosRead(session: AuthSession) {
  return canViewAllUsuariosEquipe(session)
    ? createServiceClient()
    : createClient();
}

async function fetchPermissoesPerfil(perfilId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("perfil_permissoes")
    .select("permissao:permissoes(id, slug, nome, modulo)")
    .eq("perfil_id", perfilId);
  return (
    data?.map((row) => {
      const p = row.permissao as
        | { id: string; slug: string; nome: string; modulo: string }
        | { id: string; slug: string; nome: string; modulo: string }[];
      return Array.isArray(p) ? p[0] : p;
    }).filter(Boolean) ?? []
  );
}

export async function GET(_request: Request, { params }: Params) {
  try {
    const session = await requireSession();
    const { id } = await params;
    const supabase = await clientForUsuariosRead(session);
    const { data, error } = await fetchUsuario(id, supabase);

    if (error) return jsonError(error.message, 500);
    if (!data) return jsonError("Usuário não encontrado", 404);
    if (!canViewUsuario(session, data)) return jsonForbidden();

    const permissoes = await fetchPermissoesPerfil(data.perfil_id);

    return jsonOk({ ...data, permissoes });
  } catch {
    return jsonUnauthorized();
  }
}

export async function PUT(request: Request, { params }: Params) {
  try {
    const session = await requireSession();
    const { id } = await params;
    const readClient = await clientForUsuariosRead(session);
    const { data: existing, error: findErr } = await fetchUsuario(id, readClient);

    if (findErr) return jsonError(findErr.message, 500);
    if (!existing) return jsonError("Usuário não encontrado", 404);
    if (!canEditUsuario(session, existing)) return jsonForbidden();

    const body = await request.json();
    const parsed = usuarioUpdateSchema.safeParse(body);
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

    if (parsed.data.email !== existing.email) {
      const { error: emailErr } = await service.auth.admin.updateUserById(id, {
        email: parsed.data.email,
      });
      if (emailErr) return jsonError(emailErr.message, 500);
    }

    if (parsed.data.password) {
      const { error: passErr } = await service.auth.admin.updateUserById(id, {
        password: parsed.data.password,
      });
      if (passErr) return jsonError(passErr.message, 500);
    }

    const { data, error } = await service
      .from("usuarios")
      .update({
        nome_completo: parsed.data.nome_completo,
        email: parsed.data.email,
        telefone: parsed.data.telefone || null,
        cpf: parsed.data.cpf || null,
        perfil_id: parsed.data.perfil_id,
        status: parsed.data.status,
      })
      .eq("id", id)
      .select("*, perfil:perfis(id, slug, nome, descricao)")
      .single();

    if (error) return jsonError(error.message, 500);

    const permissoes = await fetchPermissoesPerfil(data.perfil_id);
    return jsonOk({ ...data, permissoes });
  } catch {
    return jsonUnauthorized();
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const session = await requireSession();
    const { id } = await params;

    if (id === session.user.id) {
      return jsonError("Você não pode excluir sua própria conta.", 400);
    }

    const readClient = await clientForUsuariosRead(session);
    const { data: existing, error: findErr } = await fetchUsuario(id, readClient);
    if (findErr) return jsonError(findErr.message, 500);
    if (!existing) return jsonError("Usuário não encontrado", 404);
    if (!canDeleteUsuario(session, existing)) return jsonForbidden();

    const service = await createServiceClient();
    const { error: authErr } = await service.auth.admin.deleteUser(id);
    if (authErr) return jsonError(authErr.message, 500);

    return jsonOk({ deleted: true });
  } catch {
    return jsonUnauthorized();
  }
}
