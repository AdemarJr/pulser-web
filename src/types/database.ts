export type UsuarioStatus = "ativo" | "inativo" | "bloqueado";
export type EleitorSituacao =
  | "ativo"
  | "inativo"
  | "pendente"
  | "falecido"
  | "mudou_cidade";
export type EleitorSituacaoEleitoral =
  | "regular"
  | "suspensa"
  | "cancelada"
  | "pendente"
  | "outra";

export interface Perfil {
  id: string;
  slug: string;
  nome: string;
  descricao: string | null;
  is_system: boolean;
}

export interface Permissao {
  id: string;
  slug: string;
  nome: string;
  modulo: string;
}

export interface Usuario {
  id: string;
  nome_completo: string;
  email: string;
  telefone: string | null;
  cpf: string | null;
  perfil_id: string;
  status: UsuarioStatus;
  tentativas_login: number;
  ultimo_acesso: string | null;
  perfil?: Perfil;
}

export interface Estado {
  id: string;
  nome: string;
  sigla: string;
  ibge_id?: number | null;
}

export interface Cidade {
  id: string;
  nome: string;
  estado_id: string;
  ibge_id?: number | null;
  estado?: Estado;
}

export interface Bairro {
  id: string;
  nome: string;
  cidade_id: string;
  ibge_id?: number | null;
  cidade?: Cidade;
}

export interface ZonaEleitoral {
  id: string;
  numero: number;
  cidade_id: string;
  estado_id: string;
}

export interface Eleitor {
  id: string;
  nome_completo: string;
  nome_social: string | null;
  data_nascimento: string;
  sexo: string;
  cpf: string;
  rg: string;
  telefone_principal: string;
  telefone_secundario: string | null;
  email: string | null;
  cep: string;
  logradouro: string;
  numero: string;
  complemento: string | null;
  bairro_id: string;
  cidade_id: string;
  estado_id: string;
  titulo_eleitor: string;
  zona_eleitoral_id: string;
  secao_eleitoral: string;
  municipio_eleitoral: string;
  situacao_eleitoral: EleitorSituacaoEleitoral;
  local_votacao: string | null;
  lideranca_responsavel: string | null;
  grupo_politico: string | null;
  observacoes: string | null;
  prioridade: number;
  categoria: string | null;
  situacao: EleitorSituacao;
  cadastrado_por: string | null;
  created_at: string;
  updated_at: string;
  bairro?: Bairro;
  cidade?: Cidade;
  zona_eleitoral?: ZonaEleitoral;
}

export interface Auditoria {
  id: string;
  usuario_id: string | null;
  acao: string;
  entidade: string;
  entidade_id: string | null;
  dados_anteriores: Record<string, unknown> | null;
  dados_novos: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: string;
}

export interface DashboardStats {
  total_eleitores: number;
  cadastros_mes: number;
  usuarios_ativos: number;
}

export type PerfilSlug =
  | "admin_geral"
  | "coordenador"
  | "cadastrador"
  | "visualizador";
