import type { AuthSession } from "@/lib/auth/session";

/** Conta bootstrap (login Admin-super → admin@admin.com). Única que pode criar Admin Geral. */
export const SUPER_ADMIN_EMAIL =
  process.env.SUPER_ADMIN_EMAIL?.toLowerCase() ?? "admin@admin.com";

export function isSuperAdmin(session: AuthSession): boolean {
  const email = session.profile.email?.toLowerCase() ?? session.user.email?.toLowerCase();
  return email === SUPER_ADMIN_EMAIL;
}
