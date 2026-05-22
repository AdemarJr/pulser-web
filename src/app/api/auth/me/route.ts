import { createClient } from "@/lib/supabase/server";
import { canViewAllEleitores } from "@/lib/auth/eleitores-access";
import { canViewAllUsuariosEquipe } from "@/lib/auth/usuarios-access";
import { getSession } from "@/lib/auth/session";
import { jsonOk, jsonUnauthorized } from "@/lib/api/response";

export async function GET() {
  const session = await getSession();
  if (!session) return jsonUnauthorized();

  let cidadeCadastroPadrao = null;
  if (session.profile.cidade_cadastro_padrao_id) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("cidades")
      .select("id, nome, estado_id, estado:estados(id, sigla, nome)")
      .eq("id", session.profile.cidade_cadastro_padrao_id)
      .maybeSingle();
    cidadeCadastroPadrao = data;
  }

  return jsonOk({
    user: session.user,
    nomeCompleto: session.profile.nome_completo,
    perfil: session.profile.perfil,
    permissions: session.permissions,
    canViewAllEleitores: canViewAllEleitores(session),
    canViewAllUsuarios: canViewAllUsuariosEquipe(session),
    cidadeCadastroPadrao,
  });
}
