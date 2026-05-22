/** Sem embed usuarios→usuarios (PostgREST não expõe FK criado_por no cache). */
export const USUARIO_LIST_SELECT =
  "*, perfil:perfis(id, slug, nome, descricao)";

export const USUARIO_DETAIL_SELECT =
  "*, perfil:perfis(id, slug, nome, descricao, is_system)";
