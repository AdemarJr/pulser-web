import type { SupabaseClient } from "@supabase/supabase-js";
import { requireSession, type AuthSession } from "@/lib/auth/session";
import { PERMISSIONS, hasPermission } from "@/lib/auth/permissions";
import { jsonForbidden, jsonUnauthorized } from "@/lib/api/response";

export function mapDbError(message: string): string {
  if (message.includes("duplicate key") || message.includes("unique")) {
    if (message.includes("estados_sigla")) return "Já existe um estado com esta sigla";
    if (message.includes("cidades")) return "Já existe uma cidade com este nome neste estado";
    if (message.includes("bairros")) return "Já existe um bairro com este nome nesta cidade";
    if (message.includes("zonas_eleitorais")) {
      return "Já existe uma zona eleitoral com este número nesta cidade";
    }
    return "Registro duplicado";
  }
  if (message.includes("violates foreign key") || message.includes("still referenced")) {
    return "Não é possível excluir: existem registros vinculados";
  }
  return message;
}

export async function requireTerritorioRead(): Promise<AuthSession> {
  return requireSession();
}

export async function requireTerritorioWrite(): Promise<AuthSession> {
  const session = await requireSession();
  if (!hasPermission(session.permissions, PERMISSIONS.TERRITORIO_GERENCIAR)) {
    throw new Error("FORBIDDEN");
  }
  return session;
}

export function handleTerritorioAuthError(error: unknown) {
  if (error instanceof Error) {
    if (error.message === "UNAUTHORIZED") return jsonUnauthorized();
    if (error.message === "FORBIDDEN") return jsonForbidden();
  }
  return null;
}

export async function assertCidadePertenceAoEstado(
  supabase: SupabaseClient,
  cidadeId: string,
  estadoId: string
): Promise<string | null> {
  const { data, error } = await supabase
    .from("cidades")
    .select("estado_id")
    .eq("id", cidadeId)
    .single();

  if (error || !data) return "Cidade não encontrada";
  if (data.estado_id !== estadoId) {
    return "A cidade informada não pertence ao estado selecionado";
  }
  return null;
}
