/** Normaliza resposta da API territorial (lista direta ou paginada). */
export function unwrapTerritorioList<T>(data: T[] | { items: T[] } | null | undefined): T[] {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (typeof data === "object" && "items" in data && Array.isArray(data.items)) {
    return data.items;
  }
  return [];
}
