import { z } from "zod";
import { isValidCPF, nomeSchema, telefoneOpcionalSchema } from "@/lib/validators/common";

const usuarioCampos = {
  nome_completo: nomeSchema,
  email: z.string().trim().email("E-mail inválido"),
  telefone: telefoneOpcionalSchema,
  cpf: z
    .string()
    .optional()
    .transform((v) => (v ? v.replace(/\D/g, "") : ""))
    .refine((v) => !v || isValidCPF(v), "CPF inválido"),
  perfil_id: z.string().uuid("Perfil inválido"),
  status: z.enum(["ativo", "inativo", "bloqueado"]).default("ativo"),
};

export const usuarioCreateSchema = z.object({
  ...usuarioCampos,
  password: z.string().min(8, "Senha deve ter no mínimo 8 caracteres"),
});

export const usuarioUpdateSchema = z.object({
  ...usuarioCampos,
  password: z
    .string()
    .optional()
    .refine((v) => !v || v.length >= 8, "Senha deve ter no mínimo 8 caracteres"),
});

export type UsuarioCreateInput = z.input<typeof usuarioCreateSchema>;
export type UsuarioCreateOutput = z.output<typeof usuarioCreateSchema>;
export type UsuarioUpdateInput = z.input<typeof usuarioUpdateSchema>;
export type UsuarioUpdateOutput = z.output<typeof usuarioUpdateSchema>;
