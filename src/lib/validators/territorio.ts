import { z } from "zod";

export const estadoSchema = z.object({
  nome: z.string().trim().min(2, "Nome deve ter no mínimo 2 caracteres"),
  sigla: z
    .string()
    .trim()
    .length(2, "Sigla deve ter 2 caracteres")
    .transform((s) => s.toUpperCase()),
});

export const cidadeSchema = z.object({
  nome: z.string().trim().min(2, "Nome deve ter no mínimo 2 caracteres"),
  estado_id: z.string().uuid("estado_id inválido"),
});

export const bairroSchema = z.object({
  nome: z.string().trim().min(2, "Nome deve ter no mínimo 2 caracteres"),
  cidade_id: z.string().uuid("cidade_id inválido"),
});

export const zonaEleitoralSchema = z.object({
  numero: z.coerce.number().int("Número deve ser inteiro").positive("Número deve ser positivo"),
  cidade_id: z.string().uuid("cidade_id inválido"),
  estado_id: z.string().uuid("estado_id inválido"),
});

export type EstadoInput = z.infer<typeof estadoSchema>;
export type CidadeInput = z.infer<typeof cidadeSchema>;
export type BairroInput = z.infer<typeof bairroSchema>;
export type ZonaEleitoralInput = z.infer<typeof zonaEleitoralSchema>;
