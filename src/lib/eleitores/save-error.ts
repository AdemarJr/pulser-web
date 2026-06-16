const CPF_DUPLICADO =
  'duplicate key value violates unique constraint "eleitores_cpf_key"';

export const MENSAGEM_CPF_DUPLICADO =
  "Já consta esse CPF em nossa base de dados!";

export function mensagemErroSalvarEleitor(mensagem: string): string {
  if (
    mensagem.includes("eleitores_cpf_key") ||
    mensagem === CPF_DUPLICADO
  ) {
    return MENSAGEM_CPF_DUPLICADO;
  }
  return mensagem;
}
