import type { ComponentType } from "react";
import {
  LayoutDashboard,
  Users,
  UserCircle,
  MapPin,
  FileText,
  Shield,
  Vote,
} from "lucide-react";
import { PERMISSIONS } from "@/lib/auth/permissions";

export type NavItem = {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string }>;
  permission?: string;
  adminOnly?: boolean;
  /** Exibir na barra inferior mobile */
  mobilePrimary?: boolean;
};

export const navItems: NavItem[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    permission: PERMISSIONS.DASHBOARD_VISUALIZAR,
    mobilePrimary: true,
  },
  {
    href: "/eleitores",
    label: "Eleitores",
    icon: Vote,
    permission: PERMISSIONS.ELEITORES_VISUALIZAR,
    mobilePrimary: true,
  },
  {
    href: "/eleitores/novo",
    label: "Novo",
    icon: UserCircle,
    permission: PERMISSIONS.ELEITORES_CRIAR,
    mobilePrimary: true,
  },
  {
    href: "/usuarios",
    label: "Usuários",
    icon: Users,
    permission: PERMISSIONS.USUARIOS_VISUALIZAR,
  },
  {
    href: "/territorio",
    label: "Território",
    icon: MapPin,
    permission: PERMISSIONS.TERRITORIO_GERENCIAR,
  },
  {
    href: "/relatorios",
    label: "Relatórios",
    icon: FileText,
    permission: PERMISSIONS.RELATORIOS_VISUALIZAR,
  },
  {
    href: "/auditoria",
    label: "Auditoria",
    icon: Shield,
    permission: PERMISSIONS.AUDITORIA_VISUALIZAR,
  },
];

export function filterNavItems(
  items: NavItem[],
  permissions: string[],
  isAdmin: boolean
): NavItem[] {
  return items.filter((item) => {
    if (item.adminOnly && !isAdmin) return false;
    if (!item.permission) return true;
    if (item.permission === PERMISSIONS.ELEITORES_VISUALIZAR) {
      return (
        permissions.includes(PERMISSIONS.ELEITORES_VISUALIZAR) ||
        permissions.includes(PERMISSIONS.ELEITORES_VISUALIZAR_TODOS) ||
        isAdmin
      );
    }
    return permissions.includes(item.permission) || isAdmin;
  });
}
