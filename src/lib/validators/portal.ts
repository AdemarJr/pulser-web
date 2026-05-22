import { z } from "zod";

export const respostaValorSchema = z.union([
  z.string().min(1),
  z.array(z.string().min(1)).min(1),
  z.number(),
]);

export const participacaoSubmitSchema = z.object({
  consentimento: z.literal(true, {
    message: "É necessário aceitar a política de privacidade",
  }),
  respostas: z
    .array(
      z.object({
        pergunta_id: z.string().uuid(),
        valor: respostaValorSchema,
      })
    )
    .min(1, "Responda ao menos uma pergunta"),
  metadata: z
    .object({
      bairro_nome: z.string().max(120).optional(),
      faixa_etaria: z.enum(["18-24", "25-34", "35-44", "45-59", "60+"]).optional(),
    })
    .optional(),
});

export type ParticipacaoSubmitInput = z.infer<typeof participacaoSubmitSchema>;

export const campanhaCreateSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(2)
    .max(120)
    .regex(/^[a-z0-9-]+$/, "Slug: apenas letras minúsculas, números e hífen"),
  titulo: z.string().trim().min(3).max(300),
  descricao: z.string().trim().max(5000).optional(),
  imagem_url: z.string().url().optional().or(z.literal("")),
});

export const formularioCreateSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(2)
    .max(120)
    .regex(/^[a-z0-9-]+$/, "Slug: apenas letras minúsculas, números e hífen"),
  tipo: z.enum(["enquete", "quiz", "pesquisa", "intencao_voto"]),
  titulo: z.string().trim().min(3).max(300),
  descricao: z.string().trim().max(5000).optional(),
  ordem: z.coerce.number().int().min(0).default(0),
  config: z.record(z.string(), z.unknown()).optional(),
});

export const perguntaCreateSchema = z.object({
  texto: z.string().trim().min(3).max(1000),
  tipo: z.enum(["single", "multi", "texto", "escala", "intencao_candidato"]),
  ordem: z.coerce.number().int().min(0).default(0),
  obrigatoria: z.boolean().default(true),
  opcoes: z
    .array(
      z.object({
        id: z.string().min(1).max(80),
        label: z.string().min(1).max(200),
        correta: z.boolean().optional(),
        pontos: z.number().optional(),
      })
    )
    .default([]),
  config: z.record(z.string(), z.unknown()).optional(),
});
