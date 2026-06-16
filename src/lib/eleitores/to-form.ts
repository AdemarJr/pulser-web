import type { Eleitor } from "@/types/database";
import type { EleitorFormInput } from "@/lib/validators/eleitor";
import {
  maskCEP,
  maskCPF,
  maskPhone,
  maskRG,
  maskSecao,
  maskTituloEleitor,
} from "@/lib/formatters";

export function eleitorToFormInput(e: Eleitor): EleitorFormInput {
  const dataNasc = e.data_nascimento?.includes("T")
    ? e.data_nascimento.slice(0, 10)
    : e.data_nascimento;

  return {
    nome_completo: e.nome_completo,
    nome_social: e.nome_social ?? "",
    data_nascimento: dataNasc,
    sexo: e.sexo as EleitorFormInput["sexo"],
    cpf: maskCPF(e.cpf),
    rg: maskRG(e.rg),
    telefone_principal: maskPhone(e.telefone_principal),
    telefone_secundario: e.telefone_secundario ? maskPhone(e.telefone_secundario) : "",
    email: e.email ?? "",
    cep: maskCEP(e.cep),
    logradouro: e.logradouro,
    numero: e.numero,
    complemento: e.complemento ?? "",
    estado_id: e.estado_id,
    cidade_cadastro_id: e.cidade_cadastro_id ?? e.cidade_id,
    cidade_id: e.cidade_id,
    bairro_id: e.bairro_id,
    novo_bairro_nome: "",
    zona_eleitoral_id: e.zona_eleitoral_id ?? "",
    nova_zona_numero: undefined,
    titulo_eleitor: e.titulo_eleitor ? maskTituloEleitor(e.titulo_eleitor) : "",
    secao_eleitoral: e.secao_eleitoral ? maskSecao(e.secao_eleitoral) : "",
    municipio_eleitoral: e.municipio_eleitoral ?? "",
    situacao_eleitoral: e.situacao_eleitoral,
    local_votacao: e.local_votacao ?? "",
    lideranca_responsavel: e.lideranca_responsavel ?? "",
    grupo_politico: e.grupo_politico ?? "",
    observacoes: e.observacoes ?? "",
    prioridade: e.prioridade ?? 0,
    categoria: e.categoria ?? "",
    situacao: e.situacao,
  };
}
