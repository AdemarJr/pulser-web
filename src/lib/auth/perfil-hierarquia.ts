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

/** Perfis que o ator pode atribuir ao criar/editar outro usuário */
export function perfisAtribuiveis(slugAtor: string): PerfilSlug[] {
  const nivelAtor = nivelPerfil(slugAtor);
  return PERFIL_ORDEM.filter((s) => nivelPerfil(s) < nivelAtor);
}

export function podeAtribuirPerfil(slugAtor: string, slugAlvo: string): boolean {
  if (slugAtor === "admin_geral") return true;
  return nivelPerfil(slugAlvo) < nivelPerfil(slugAtor);
}

export function podeGerenciarUsuario(
  slugAtor: string,
  slugAlvo: string,
  mesmoUsuario: boolean
): boolean {
  if (mesmoUsuario) return false;
  if (slugAtor === "admin_geral") return true;
  return nivelPerfil(slugAlvo) < nivelPerfil(slugAtor);
}

export function podeVisualizarUsuario(
  slugAtor: string,
  slugAlvo: string,
  mesmoUsuario: boolean
): boolean {
  if (mesmoUsuario) return true;
  if (slugAtor === "admin_geral") return true;
  return nivelPerfil(slugAlvo) <= nivelPerfil(slugAtor);
}
