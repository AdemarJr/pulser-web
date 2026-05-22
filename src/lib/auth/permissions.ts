export const PERMISSIONS = {
  USUARIOS_GERENCIAR: "usuarios.gerenciar",
  USUARIOS_VISUALIZAR: "usuarios.visualizar",
  ELEITORES_CRIAR: "eleitores.criar",
  ELEITORES_EDITAR_PROPRIOS: "eleitores.editar_proprios",
  ELEITORES_EDITAR_TODOS: "eleitores.editar_todos",
  ELEITORES_VISUALIZAR: "eleitores.visualizar",
  ELEITORES_VISUALIZAR_TODOS: "eleitores.visualizar_todos",
  ELEITORES_EXCLUIR: "eleitores.excluir",
  ELEITORES_APROVAR: "eleitores.aprovar",
  ELEITORES_EXPORTAR: "eleitores.exportar",
  TERRITORIO_GERENCIAR: "territorio.gerenciar",
  RELATORIOS_VISUALIZAR: "relatorios.visualizar",
  RELATORIOS_EXPORTAR: "relatorios.exportar",
  AUDITORIA_VISUALIZAR: "auditoria.visualizar",
  DASHBOARD_VISUALIZAR: "dashboard.visualizar",
  PORTAL_GERENCIAR: "portal.gerenciar",
  PORTAL_VISUALIZAR: "portal.visualizar",
} as const;

export type PermissionSlug =
  (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const PERFIL_PERMISSIONS: Record<string, PermissionSlug[]> = {
  admin_geral: Object.values(PERMISSIONS),
  coordenador: [
    PERMISSIONS.PORTAL_VISUALIZAR,
    PERMISSIONS.USUARIOS_GERENCIAR,
    PERMISSIONS.USUARIOS_VISUALIZAR,
    PERMISSIONS.ELEITORES_VISUALIZAR,
    PERMISSIONS.ELEITORES_VISUALIZAR_TODOS,
    PERMISSIONS.ELEITORES_EDITAR_PROPRIOS,
    PERMISSIONS.ELEITORES_EDITAR_TODOS,
    PERMISSIONS.ELEITORES_EXCLUIR,
    PERMISSIONS.ELEITORES_APROVAR,
    PERMISSIONS.ELEITORES_EXPORTAR,
    PERMISSIONS.RELATORIOS_VISUALIZAR,
    PERMISSIONS.RELATORIOS_EXPORTAR,
    PERMISSIONS.DASHBOARD_VISUALIZAR,
    PERMISSIONS.AUDITORIA_VISUALIZAR,
  ],
  cadastrador: [
    PERMISSIONS.ELEITORES_CRIAR,
    PERMISSIONS.ELEITORES_EDITAR_PROPRIOS,
    PERMISSIONS.ELEITORES_VISUALIZAR,
    PERMISSIONS.DASHBOARD_VISUALIZAR,
  ],
  visualizador: [
    PERMISSIONS.ELEITORES_VISUALIZAR,
    PERMISSIONS.DASHBOARD_VISUALIZAR,
    PERMISSIONS.RELATORIOS_VISUALIZAR,
  ],
};

export function hasPermission(
  userPermissions: string[],
  required: PermissionSlug
): boolean {
  return userPermissions.includes(required);
}

export function hasAnyPermission(
  userPermissions: string[],
  required: PermissionSlug[]
): boolean {
  return required.some((p) => userPermissions.includes(p));
}
