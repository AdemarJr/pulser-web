export type FonteReferencia = "ibge" | "brasilapi";

export interface ReferenciaEstado {
  ibge_id: number;
  sigla: string;
  nome: string;
  fonte: FonteReferencia;
}

export interface ReferenciaMunicipio {
  ibge_id: number;
  nome: string;
  uf: string;
  fonte: FonteReferencia;
}

export interface ReferenciaDistrito {
  ibge_id: number;
  nome: string;
  municipio_ibge_id: number;
  fonte: "ibge";
}
