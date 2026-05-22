import type { PerfilSlug } from "@/types/database";

/** Maior = mais privilégio na hierarquia */
export const PERFIL_NIVEL: Record<PerfilSlug, number> = {
  admin_geral: 4,
  coordenador: 3,
  cadastrador: 2,
  visualizador: 1,
};

export const PERFIL_ORDEM: PerfilSlug[] = [
  "admin_geral",
  "coordenador",
  "cadastrador",
  "visualizador",
];

export function nivelPerfil(slug: string): number {
  return PERFIL_NIVEL[slug as PerfilSlug] ?? 0;
}

export function podeAcessarModuloUsuarios(slugAtor: string): boolean {
  return slugAtor === "admin_geral" || slugAtor === "coordenador";
}

/** Perfis que o ator pode atribuir ao criar/editar outro usuário */
export function perfisAtribuiveis(
  slugAtor: string,
  superAdmin = false
): PerfilSlug[] {
  if (superAdmin) return [...PERFIL_ORDEM];
  if (slugAtor === "admin_geral") {
    return ["coordenador", "cadastrador", "visualizador"];
  }
  if (slugAtor === "coordenador") {
    return ["cadastrador", "visualizador"];
  }
  return [];
}

export function podeAtribuirPerfil(
  slugAtor: string,
  slugAlvo: string,
  superAdmin = false
): boolean {
  return perfisAtribuiveis(slugAtor, superAdmin).includes(slugAlvo as PerfilSlug);
}

export function podeGerenciarUsuario(
  slugAtor: string,
  slugAlvo: string,
  mesmoUsuario: boolean,
  superAdmin = false
): boolean {
  if (mesmoUsuario) return false;
  if (superAdmin) return true;
  if (slugAtor === "admin_geral") {
    return slugAlvo !== "admin_geral";
  }
  if (slugAtor === "coordenador") {
    return nivelPerfil(slugAlvo) < nivelPerfil(slugAtor);
  }
  return false;
}

export function podeVisualizarUsuario(
  slugAtor: string,
  slugAlvo: string,
  mesmoUsuario: boolean,
  superAdmin = false
): boolean {
  if (mesmoUsuario) return true;
  if (!podeAcessarModuloUsuarios(slugAtor) && !superAdmin) return false;
  if (superAdmin) return true;
  if (slugAtor === "admin_geral") return true;
  if (slugAtor === "coordenador") {
    return nivelPerfil(slugAlvo) < nivelPerfil(slugAtor);
  }
  return false;
}
