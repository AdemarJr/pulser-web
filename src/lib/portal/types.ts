export type PortalFormularioTipo = "enquete" | "quiz" | "pesquisa" | "intencao_voto";
export type PortalFormularioStatus = "rascunho" | "publicado" | "encerrado";
export type PortalPerguntaTipo =
  | "single"
  | "multi"
  | "texto"
  | "escala"
  | "intencao_candidato";

export type OpcaoPergunta = {
  id: string;
  label: string;
  correta?: boolean;
  pontos?: number;
};

export type Campanha = {
  id: string;
  slug: string;
  titulo: string;
  descricao: string | null;
  status: PortalFormularioStatus;
  imagem_url: string | null;
  publicado_em: string | null;
  encerrada_em: string | null;
  created_at: string;
};

export type Formulario = {
  id: string;
  campanha_id: string;
  slug: string;
  tipo: PortalFormularioTipo;
  titulo: string;
  descricao: string | null;
  status: PortalFormularioStatus;
  ordem: number;
  config: Record<string, unknown>;
  publicado_em: string | null;
};

export type Pergunta = {
  id: string;
  formulario_id: string;
  ordem: number;
  texto: string;
  tipo: PortalPerguntaTipo;
  opcoes: OpcaoPergunta[];
  obrigatoria: boolean;
  config: Record<string, unknown>;
};

export type ResultadoOpcao = {
  pergunta_id: string;
  pergunta_texto: string;
  opcao_id: string;
  opcao_label: string;
  total_votos: number;
};

export const TIPO_FORMULARIO_LABEL: Record<PortalFormularioTipo, string> = {
  enquete: "Enquete",
  quiz: "Quiz",
  pesquisa: "Pesquisa",
  intencao_voto: "Intenção de voto",
};
