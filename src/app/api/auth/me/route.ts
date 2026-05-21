import { getSession } from "@/lib/auth/session";
import { jsonOk, jsonUnauthorized } from "@/lib/api/response";

export async function GET() {
  const session = await getSession();
  if (!session) return jsonUnauthorized();

  return jsonOk({
    user: session.user,
    perfil: session.profile.perfil,
    permissions: session.permissions,
    canViewAllEleitores: session.profile.perfil?.slug === "admin_geral",
  });
}
