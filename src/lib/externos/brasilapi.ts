import type { ReferenciaEstado, ReferenciaMunicipio } from "@/lib/externos/types";

const BRASILAPI_BASE = "https://brasilapi.com.br/api/ibge";
const CACHE_24H = { next: { revalidate: 86400 } } as const;

interface BrasilApiUfRaw {
  id: number;
  sigla: string;
  nome: string;
}

interface BrasilApiMunicipioRaw {
  codigo_ibge: string;
  nome: string;
}

async function fetchBrasilApi<T>(url: string): Promise<T> {
  const res = await fetch(url, CACHE_24H);
  if (!res.ok) {
    throw new Error(`BrasilAPI indisponível (${res.status})`);
  }
  return res.json() as Promise<T>;
}

export async function getBrasilApiEstados(): Promise<ReferenciaEstado[]> {
  const data = await fetchBrasilApi<BrasilApiUfRaw[]>(`${BRASILAPI_BASE}/uf/v1`);
  return data
    .map((e) => ({
      ibge_id: e.id,
      sigla: e.sigla,
      nome: e.nome,
      fonte: "brasilapi" as const,
    }))
    .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
}

export async function getBrasilApiMunicipiosPorUf(
  uf: string
): Promise<ReferenciaMunicipio[]> {
  const sigla = uf.toUpperCase();
  const data = await fetchBrasilApi<BrasilApiMunicipioRaw[]>(
    `${BRASILAPI_BASE}/municipios/v1/${sigla}`
  );
  return data
    .map((m) => ({
      ibge_id: Number(m.codigo_ibge),
      nome: m.nome,
      uf: sigla,
      fonte: "brasilapi" as const,
    }))
    .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
}
