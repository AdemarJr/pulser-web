import { createApiClient, createServiceClient } from "@/lib/supabase/server";
import { loginSchema } from "@/lib/validators/eleitor";
import { jsonError, jsonOk } from "@/lib/api/response";

const MAX_ATTEMPTS = Number(process.env.MAX_LOGIN_ATTEMPTS ?? 5);
const LOCKOUT_MINUTES = Number(process.env.LOGIN_LOCKOUT_MINUTES ?? 15);

async function findUsuarioByEmail(email: string) {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!serviceKey) return null;

  const service = await createServiceClient();
  const { data } = await service
    .from("usuarios")
    .select("id, status, tentativas_login, bloqueado_ate")
    .eq("email", email)
    .maybeSingle();

  return data;
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Corpo da requisição inválido");
  }

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.issues[0]?.message ?? "Dados inválidos");
  }

  const { email, password } = parsed.data;
  const usuario = await findUsuarioByEmail(email);

  if (usuario?.status === "bloqueado") {
    return jsonError("Usuário bloqueado. Contate o administrador.", 403);
  }

  if (usuario?.bloqueado_ate && new Date(usuario.bloqueado_ate) > new Date()) {
    return jsonError(
      `Conta temporariamente bloqueada. Tente novamente após ${LOCKOUT_MINUTES} minutos.`,
      429
    );
  }

  const supabase = await createApiClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    if (usuario && process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()) {
      const service = await createServiceClient();
      const attempts = (usuario.tentativas_login ?? 0) + 1;
      const updates: Record<string, unknown> = { tentativas_login: attempts };
      if (attempts >= MAX_ATTEMPTS) {
        updates.bloqueado_ate = new Date(
          Date.now() + LOCKOUT_MINUTES * 60 * 1000
        ).toISOString();
        updates.tentativas_login = 0;
      }
      await service.from("usuarios").update(updates).eq("id", usuario.id);
    }
    return jsonError("E-mail ou senha inválidos", 401);
  }

  if (usuario) {
    await supabase
      .from("usuarios")
      .update({
        tentativas_login: 0,
        bloqueado_ate: null,
        ultimo_acesso: new Date().toISOString(),
      })
      .eq("id", usuario.id);

    await supabase.from("sessoes_usuario").insert({
      usuario_id: usuario.id,
      ip_address: request.headers.get("x-forwarded-for")?.split(",")[0] ?? null,
      user_agent: request.headers.get("user-agent"),
    });
  }

  return jsonOk({
    user: { id: data.user.id, email: data.user.email },
  });
}
