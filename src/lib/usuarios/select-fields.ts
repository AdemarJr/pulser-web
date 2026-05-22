export const USUARIO_LIST_SELECT =
  "*, perfil:perfis(id, slug, nome, descricao), criador:usuarios!criado_por(nome_completo)";

export const USUARIO_LIST_SELECT_SEM_CRIADOR =
  "*, perfil:perfis(id, slug, nome, descricao)";

export const USUARIO_DETAIL_SELECT =
  "*, perfil:perfis(id, slug, nome, descricao, is_system), criador:usuarios!criado_por(nome_completo)";

export const USUARIO_DETAIL_SELECT_SEM_CRIADOR =
  "*, perfil:perfis(id, slug, nome, descricao, is_system)";

export function isUsuarioCriadorEmbedError(message: string): boolean {
  return (
    message.includes("criado_por") ||
    message.includes("criador") ||
    message.includes("Could not embed") ||
    message.includes("more than one relationship")
  );
}
