import { z } from "zod";
import {
  cepSchema,
  cpfSchema,
  emailOpcionalSchema,
  telefoneOpcionalSchema,
  telefoneSchema,
  uuidRequired,
} from "@/lib/validators/common";

const nomeCompletoEleitorSchema = z
  .string()
  .trim()
  .min(5, "Informe o nome completo")
  .max(200, "Nome muito longo")
  .refine((v) => /[A-Za-zÀ-ÿ]/.test(v), "Nome deve conter letras")
  .refine((v) => !/^\d+$/.test(v.replace(/\s/g, "")), "Nome não pode ser apenas números")
  .refine(
    (v) => v.split(/\s+/).filter((part) => part.length >= 2).length >= 2,
    "Informe nome e sobrenome"
  );

const rgOpcional = z
  .string()
  .optional()
  .or(z.literal(""))
  .transform((v) => (v ?? "").replace(/\D/g, ""))
  .refine((v) => v === "" || v.length >= 5, "RG inválido");

const tituloEleitorOpcional = z
  .string()
  .optional()
  .or(z.literal(""))
  .transform((v) => (v ?? "").replace(/\D/g, ""))
  .refine((v) => v === "" || v.length >= 12, "Título de eleitor inválido");

const secaoEleitoralOpcional = z
  .string()
  .optional()
  .or(z.literal(""))
  .transform((v) => (v ?? "").replace(/\D/g, ""))
  .refine((v) => v === "" || (v.length >= 1 && v.length <= 4), "Seção inválida");

const municipioEleitoralOpcional = z
  .string()
  .trim()
  .optional()
  .or(z.literal(""))
  .transform((v) => v ?? "");

const eleitorCamposComuns = {
  nome_completo: nomeCompletoEleitorSchema,
  nome_social: z.string().trim().max(200).optional().or(z.literal("")),
  data_nascimento: z
    .string()
    .min(1, "Data de nascimento obrigatória")
    .refine((d) => !Number.isNaN(Date.parse(d)), "Data inválida")
    .refine((d) => new Date(d) <= new Date(), "Data não pode ser futura"),
  sexo: z.enum(["masculino", "feminino", "outro", "nao_informar"]),
  cpf: cpfSchema,
  rg: rgOpcional,
  telefone_principal: telefoneSchema,
  telefone_secundario: telefoneOpcionalSchema,
  email: emailOpcionalSchema,
  cep: cepSchema,
  logradouro: z.string().trim().min(2, "Logradouro obrigatório").max(200),
  numero: z.string().trim().min(1, "Número obrigatório").max(20),
  complemento: z.string().trim().max(100).optional().or(z.literal("")),
  cidade_cadastro_id: uuidRequired("Cidade do cadastro"),
  cidade_id: uuidRequired("Município do eleitor"),
  estado_id: uuidRequired("Estado"),
  titulo_eleitor: tituloEleitorOpcional,
  secao_eleitoral: secaoEleitoralOpcional,
  municipio_eleitoral: municipioEleitoralOpcional,
  situacao_eleitoral: z
    .enum(["regular", "suspensa", "cancelada", "pendente", "outra"])
    .default("regular"),
  local_votacao: z.string().trim().max(200).optional().or(z.literal("")),
  lideranca_responsavel: z.string().trim().max(200).optional().or(z.literal("")),
  grupo_politico: z.string().trim().max(100).optional().or(z.literal("")),
  observacoes: z.string().trim().max(2000).optional().or(z.literal("")),
  prioridade: z.coerce.number().min(0).max(10).default(0),
  categoria: z.string().trim().max(50).optional().or(z.literal("")),
  situacao: z
    .enum(["ativo", "inativo", "pendente", "falecido", "mudou_cidade"])
    .default("pendente"),
} as const;

/** Dados já com bairro_id e zona_eleitoral_id resolvidos (insert no banco). */
export const eleitorPersistSchema = z.object({
  ...eleitorCamposComuns,
  bairro_id: uuidRequired("Bairro"),
  zona_eleitoral_id: z.string().uuid().nullable().optional(),
  titulo_eleitor: z.string().nullable(),
  secao_eleitoral: z.string().nullable(),
  municipio_eleitoral: z.string().nullable(),
  rg: z.string().nullable(),
});

export const eleitorSchema = z
  .object({
    ...eleitorCamposComuns,
    bairro_id: z.string().uuid().optional().or(z.literal("")),
    novo_bairro_nome: z.string().trim().max(150).optional().or(z.literal("")),
    zona_eleitoral_id: z.string().uuid().optional().or(z.literal("")),
    nova_zona_numero: z.coerce.number().int().positive().optional(),
  })
  .superRefine((data, ctx) => {
    const temBairro = Boolean(data.bairro_id) || Boolean(data.novo_bairro_nome?.trim());
    if (!temBairro) {
      ctx.addIssue({
        code: "custom",
        path: ["bairro_id"],
        message: "Selecione um bairro ou informe o nome de um novo",
      });
    }
  });

export type EleitorFormData = z.infer<typeof eleitorSchema>;
export type EleitorFormInput = z.input<typeof eleitorSchema>;

const LOGIN_ALIASES: Record<string, string> = {
  admin: "admin@admin.com",
  "admin-super": "admin@admin.com",
};

const loginEmailSchema = z
  .string()
  .trim()
  .transform((value) => LOGIN_ALIASES[value.toLowerCase()] ?? value)
  .pipe(z.string().email("E-mail inválido"));

export const loginSchema = z.object({
  email: loginEmailSchema,
  password: z.string().min(1, "Informe a senha"),
});

export const recuperarSenhaSchema = z.object({
  email: z.string().trim().email("E-mail inválido"),
});

export { usuarioCreateSchema as usuarioSchema } from "@/lib/validators/usuario";
