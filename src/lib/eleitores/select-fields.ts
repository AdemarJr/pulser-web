/** Embeds explícitos — eleitores tem duas FKs para cidades (cidade_id e cidade_cadastro_id). */
export const ELEITOR_LIST_SELECT =
  "*, bairro:bairros(nome), cidade:cidades!cidade_id(nome), cidade_cadastro:cidades!cidade_cadastro_id(nome, estado:estados(sigla)), zona_eleitoral:zonas_eleitorais(numero)";

export const ELEITOR_LIST_SELECT_SEM_CADASTRO =
  "*, bairro:bairros(nome), cidade:cidades!cidade_id(nome), zona_eleitoral:zonas_eleitorais(numero)";

export const ELEITOR_DETAIL_SELECT =
  "*, bairro:bairros(nome), cidade:cidades!cidade_id(nome, estado:estados(sigla, nome)), cidade_cadastro:cidades!cidade_cadastro_id(nome, estado:estados(sigla, nome)), zona_eleitoral:zonas_eleitorais(numero), cadastrador:usuarios!cadastrado_por(nome_completo)";

export const ELEITOR_DETAIL_SELECT_SEM_CADASTRO =
  "*, bairro:bairros(nome), cidade:cidades!cidade_id(nome, estado:estados(sigla, nome)), zona_eleitoral:zonas_eleitorais(numero), cadastrador:usuarios!cadastrado_por(nome_completo)";

export function isCidadeCadastroSchemaError(message: string): boolean {
  return (
    message.includes("cidade_cadastro_id") ||
    message.includes("cidade_cadastro") ||
    message.includes("Could not embed") ||
    message.includes("more than one relationship")
  );
}
