import type {
  ReferenciaDistrito,
  ReferenciaEstado,
  ReferenciaMunicipio,
} from "@/lib/externos/types";

const IBGE_BASE = "https://servicodados.ibge.gov.br/api/v1/localidades";
const CACHE_24H = { next: { revalidate: 86400 } } as const;

interface IbgeEstadoRaw {
  id: number;
  sigla: string;
  nome: string;
}

interface IbgeMunicipioRaw {
  id: number;
  nome: string;
}

interface IbgeDistritoRaw {
  id: number;
  nome: string;
  municipio: { id: number };
}

async function fetchIbge<T>(url: string): Promise<T> {
  const res = await fetch(url, CACHE_24H);
  if (!res.ok) {
    throw new Error(`IBGE indisponível (${res.status})`);
  }
  return res.json() as Promise<T>;
}

export async function getIbgeEstados(): Promise<ReferenciaEstado[]> {
  const data = await fetchIbge<IbgeEstadoRaw[]>(`${IBGE_BASE}/estados?orderBy=nome`);
  return data.map((e) => ({
    ibge_id: e.id,
    sigla: e.sigla,
    nome: e.nome,
    fonte: "ibge" as const,
  }));
}

export async function getIbgeMunicipiosPorUf(uf: string): Promise<ReferenciaMunicipio[]> {
  const sigla = uf.toUpperCase();
  const data = await fetchIbge<IbgeMunicipioRaw[]>(
    `${IBGE_BASE}/estados/${sigla}/municipios?orderBy=nome`
  );
  return data.map((m) => ({
    ibge_id: m.id,
    nome: m.nome,
    uf: sigla,
    fonte: "ibge" as const,
  }));
}

export async function getIbgeDistritosPorMunicipio(
  municipioIbgeId: number | string
): Promise<ReferenciaDistrito[]> {
  const data = await fetchIbge<IbgeDistritoRaw[]>(
    `${IBGE_BASE}/municipios/${municipioIbgeId}/distritos`
  );
  const municipioId = Number(municipioIbgeId);
  return data.map((d) => ({
    ibge_id: d.id,
    nome: d.nome,
    municipio_ibge_id: d.municipio?.id ?? municipioId,
    fonte: "ibge" as const,
  }));
}
