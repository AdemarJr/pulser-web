import { createClient } from "@/lib/supabase/server";
import { requireSession } from "@/lib/auth/session";
import {
  canViewAllEleitores,
  canViewEleitores,
} from "@/lib/auth/eleitores-access";
import { PERMISSIONS, hasPermission } from "@/lib/auth/permissions";
import { eleitorPersistSchema, eleitorSchema } from "@/lib/validators/eleitor";
import {
  resolveBairroId,
  resolveZonaIdOpcional,
} from "@/lib/territorio/resolve-bairro-zona";
import {
  ELEITOR_LIST_SELECT,
  ELEITOR_LIST_SELECT_SEM_CADASTRO,
  isCidadeCadastroSchemaError,
} from "@/lib/eleitores/select-fields";
import { jsonError, jsonForbidden, jsonOk, jsonUnauthorized } from "@/lib/api/response";
import { mensagemErroSalvarEleitor } from "@/lib/eleitores/save-error";

export async function GET(request: Request) {
  try {
    const session = await requireSession();
    if (!canViewEleitores(session)) {
      return jsonForbidden();
    }

    const { searchParams } = new URL(request.url);
    const supabase = await createClient();

    const page = Number(searchParams.get("page") ?? 1);
    const limit = Math.min(Number(searchParams.get("limit") ?? 20), 100);
    const from = (page - 1) * limit;

    function buildQuery(selectFields: string) {
      let q = supabase
        .from("eleitores")
        .select(selectFields, { count: "exact" })
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

      if (!canViewAllEleitores(session)) {
        q = q.eq("cadastrado_por", session.user.id);
      }
      if (searchParams.get("nome")) {
        q = q.ilike("nome_completo", `%${searchParams.get("nome")}%`);
      }
      if (searchParams.get("cpf")) {
        q = q.eq("cpf", searchParams.get("cpf")!.replace(/\D/g, ""));
      }
      if (searchParams.get("cidade_id")) {
        q = q.eq("cidade_id", searchParams.get("cidade_id")!);
      }
      if (searchParams.get("cidade_cadastro_id")) {
        q = q.eq("cidade_cadastro_id", searchParams.get("cidade_cadastro_id")!);
      }
      if (searchParams.get("bairro_id")) {
        q = q.eq("bairro_id", searchParams.get("bairro_id")!);
      }
      if (searchParams.get("zona_eleitoral_id")) {
        q = q.eq("zona_eleitoral_id", searchParams.get("zona_eleitoral_id")!);
      }
      if (searchParams.get("situacao")) {
        q = q.eq("situacao", searchParams.get("situacao")!);
      }
      return q.range(from, from + limit - 1);
    }

    let { data, error, count } = await buildQuery(ELEITOR_LIST_SELECT);

    if (error && isCidadeCadastroSchemaError(error.message)) {
      const retry = await buildQuery(ELEITOR_LIST_SELECT_SEM_CADASTRO);
      data = retry.data;
      error = retry.error;
      count = retry.count;
    }

    if (error) return jsonError(error.message, 500);

    return jsonOk({
      items: data,
      total: count,
      page,
      limit,
      escopo: canViewAllEleitores(session) ? "todos" : "proprios",
    });
  } catch {
    return jsonUnauthorized();
  }
}

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    if (!hasPermission(session.permissions, PERMISSIONS.ELEITORES_CRIAR)) {
      return jsonForbidden();
    }

    const body = await request.json();
    const parsed = eleitorSchema.safeParse(body);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      const path = issue?.path?.join(".") ?? "";
      return jsonError(
        path ? `${path}: ${issue?.message}` : (issue?.message ?? "Dados inválidos")
      );
    }

    const supabase = await createClient();

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
      rg: rest.rg || null,
      bairro_id: bairroId,
      zona_eleitoral_id: zonaId,
    });
    if (!persistParsed.success) {
      return jsonError(persistParsed.error.issues[0]?.message ?? "Dados inválidos");
    }

    const payload = {
      ...persistParsed.data,
      cadastrado_por: session.user.id,
      atualizado_por: session.user.id,
    };

    const { data, error } = await supabase
      .from("eleitores")
      .insert(payload)
      .select()
      .single();

    if (error) return jsonError(mensagemErroSalvarEleitor(error.message), 500);
    return jsonOk(data, 201);
  } catch {
    return jsonUnauthorized();
  }
}
