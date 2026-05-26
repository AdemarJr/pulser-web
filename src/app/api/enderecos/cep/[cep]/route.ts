import { jsonError, jsonOk } from "@/lib/api/response";
import { onlyDigits } from "@/lib/formatters";

type EnderecoCep = {
  cep: string;
  logradouro: string;
  bairro: string;
  cidade: string;
  estado: string;
  source: "brasilapi" | "viacep";
};

type BrasilApiCep = {
  cep?: string;
  street?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
};

type ViaCep = {
  cep?: string;
  logradouro?: string;
  bairro?: string;
  localidade?: string;
  uf?: string;
  erro?: boolean;
};

type Params = { params: Promise<{ cep: string }> };

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const response = await fetch(url, {
      headers: { Accept: "application/json" },
      next: { revalidate: 60 * 60 * 24 * 30 },
    });

    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

function normalizeCepResponse(data: EnderecoCep): EnderecoCep {
  return {
    ...data,
    cep: onlyDigits(data.cep),
    estado: data.estado.toUpperCase(),
  };
}

async function buscarBrasilApi(cep: string): Promise<EnderecoCep | null> {
  const data = await fetchJson<BrasilApiCep>(
    `https://brasilapi.com.br/api/cep/v2/${cep}`
  );

  if (!data?.city || !data.state) return null;

  return normalizeCepResponse({
    cep: data.cep ?? cep,
    logradouro: data.street ?? "",
    bairro: data.neighborhood ?? "",
    cidade: data.city,
    estado: data.state,
    source: "brasilapi",
  });
}

async function buscarViaCep(cep: string): Promise<EnderecoCep | null> {
  const data = await fetchJson<ViaCep>(`https://viacep.com.br/ws/${cep}/json/`);

  if (!data || data.erro || !data.localidade || !data.uf) return null;

  return normalizeCepResponse({
    cep: data.cep ?? cep,
    logradouro: data.logradouro ?? "",
    bairro: data.bairro ?? "",
    cidade: data.localidade,
    estado: data.uf,
    source: "viacep",
  });
}

export async function GET(_request: Request, { params }: Params) {
  const { cep: rawCep } = await params;
  const cep = onlyDigits(rawCep);

  if (cep.length !== 8) {
    return jsonError("CEP inválido", 400);
  }

  const endereco = (await buscarBrasilApi(cep)) ?? (await buscarViaCep(cep));

  if (!endereco) {
    return jsonError("CEP não encontrado", 404);
  }

  return jsonOk(endereco);
}
