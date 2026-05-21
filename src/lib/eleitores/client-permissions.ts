import { PERMISSIONS } from "@/lib/auth/permissions";
import type { Eleitor } from "@/types/database";

export type AuthMe = {
  user: { id: string };
  permissions: string[];
  canViewAllEleitores: boolean;
};

export function canEditEleitor(me: AuthMe, eleitor: Pick<Eleitor, "cadastrado_por">): boolean {
  if (me.canViewAllEleitores) return true;
  if (!me.permissions.includes(PERMISSIONS.ELEITORES_EDITAR_PROPRIOS)) return false;
  return eleitor.cadastrado_por === me.user.id;
}

export function canDeleteEleitor(me: AuthMe, eleitor: Pick<Eleitor, "cadastrado_por">): boolean {
  if (!me.permissions.includes(PERMISSIONS.ELEITORES_EXCLUIR)) return false;
  if (me.canViewAllEleitores) return true;
  return eleitor.cadastrado_por === me.user.id;
}
