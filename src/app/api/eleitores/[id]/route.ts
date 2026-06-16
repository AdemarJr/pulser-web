import { createClient, createServiceClient } from "@/lib/supabase/server";
import { requireSession } from "@/lib/auth/session";
import {
  canViewAllEleitores,
  canViewEleitores,
  isEleitorOwnedByUser,
} from "@/lib/auth/eleitores-access";
import { fetchEleitorById } from "@/lib/eleitores/fetch-by-id";
import { PERMISSIONS, hasPermission } from "@/lib/auth/permissions";
import { eleitorSchema, eleitorPersistSchema } from "@/lib/validators/eleitor";
import {
  resolveBairroId,
  resolveZonaIdOpcional,
} from "@/lib/territorio/resolve-bairro-zona";
import {
  jsonError,
  jsonForbidden,
  jsonOk,
  jsonUnauthorized,
} from "@/lib/api/response";

type Params = { params: Promise<{ id: string }> };

async function getExistingEleitor(
  supabase: Awaited<ReturnType<typeof createClient>>,
  id: string,
  cadastradoPorFilter?: string
) {
  let query = supabase
    .from("eleitores")
    .select("id, cadastrado_por")
    .eq("id", id)
    .is("deleted_at", null);

  if (cadastradoPorFilter) {
    query = query.eq("cadastrado_por", cadastradoPorFilter);
  }

  return query.maybeSingle();
}

export async function GET(_request: Request, { params }: Params) {
  try {
    const session = await requireSession();
    if (!canViewEleitores(session)) return jsonForbidden();

    const { id } = await params;
    const supabase = await createClient();

    const { data, error } = await fetchEleitorById(
      supabase,
      id,
      canViewAllEleitores(session) ? undefined : { cadastradoPor: session.user.id }
    );

    if (error) {
      return jsonError(error.message, 500);
    }
    if (!data) {
      return jsonError("Eleitor não encontrado", 404);
    }

    return jsonOk(data);
  } catch {
    return jsonUnauthorized();
  }
}

export async function PUT(request: Request, { params }: Params) {
  try {
    const session = await requireSession();
    const { id } = await params;
    const supabase = await createClient();

    const { data: existing, error: findError } = await getExistingEleitor(
      supabase,
      id,
      canViewAllEleitores(session) ? undefined : session.user.id
    );

    if (findError) return jsonError(findError.message, 500);
    if (!existing) return jsonError("Eleitor não encontrado", 404);

    const canEditAll = canViewAllEleitores(session);
    const canEditOwn =
      hasPermission(session.permissions, PERMISSIONS.ELEITORES_EDITAR_PROPRIOS) &&
      isEleitorOwnedByUser(existing.cadastrado_por, session.user.id);

    if (!canEditAll && !canEditOwn) return jsonForbidden();

    const body = await request.json();
    const parsed = eleitorSchema.safeParse(body);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      const path = issue?.path?.join(".") ?? "";
      return jsonError(
        path ? `${path}: ${issue?.message}` : (issue?.message ?? "Dados inválidos")
      );
    }

    let bairroId: string;
    let zonaId: string | null;
    try {
      bairroId = await resolveBairroId(
        supabase,
        parsed.data.cidade_id,
        parsed.data.bairro_id || undefined,
        parsed.data.novo_bairro_nome
      );
      zonaId = await resolveZonaIdOpcional(
        supabase,
        parsed.data.cidade_id,
        parsed.data.estado_id,
        parsed.data.zona_eleitoral_id || undefined,
        parsed.data.nova_zona_numero
      );
    } catch (e) {
      return jsonError(e instanceof Error ? e.message : "Erro territorial", 400);
    }

    const {
      novo_bairro_nome: _nb,
      nova_zona_numero: _nz,
      bairro_id: _bi,
      zona_eleitoral_id: _zi,
      ...rest
    } = parsed.data;

    const persistParsed = eleitorPersistSchema.safeParse({
      ...rest,
      titulo_eleitor: rest.titulo_eleitor || null,
      secao_eleitoral: rest.secao_eleitoral || null,
      municipio_eleitoral: rest.municipio_eleitoral || null,
      bairro_id: bairroId,
      zona_eleitoral_id: zonaId,
    });
    if (!persistParsed.success) {
      return jsonError(persistParsed.error.issues[0]?.message ?? "Dados inválidos");
    }

    const { data, error } = await supabase
      .from("eleitores")
      .update({
        ...persistParsed.data,
        atualizado_por: session.user.id,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) return jsonError(error.message, 500);
    return jsonOk(data);
  } catch {
    return jsonUnauthorized();
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    const session = await requireSession();
    if (!hasPermission(session.permissions, PERMISSIONS.ELEITORES_EXCLUIR)) {
      return jsonForbidden();
    }

    const { id } = await params;
    const supabase = await createClient();

    const { data: existing, error: findError } = await getExistingEleitor(
      supabase,
      id,
      canViewAllEleitores(session) ? undefined : session.user.id
    );

    if (findError) return jsonError(findError.message, 500);
    if (!existing) return jsonError("Eleitor não encontrado", 404);

    if (!canViewAllEleitores(session)) {
      if (!isEleitorOwnedByUser(existing.cadastrado_por, session.user.id)) {
        return jsonForbidden();
      }
    }

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
    const client = serviceKey ? await createServiceClient() : supabase;

    const { error } = await client
      .from("eleitores")
      .update({
        deleted_at: new Date().toISOString(),
        atualizado_por: session.user.id,
      })
      .eq("id", id);

    if (error) return jsonError(error.message, 500);
    return jsonOk({ deleted: true });
  } catch {
    return jsonUnauthorized();
  }
}
