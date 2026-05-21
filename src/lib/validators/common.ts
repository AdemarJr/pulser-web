import { z } from "zod";

export function onlyDigits(value: string): string {
  return value.replace(/\D/g, "");
}

export function isValidCPF(cpf: string): boolean {
  const digits = onlyDigits(cpf);
  if (digits.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(digits)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) sum += Number(digits[i]) * (10 - i);
  let d1 = (sum * 10) % 11;
  if (d1 === 10) d1 = 0;
  if (d1 !== Number(digits[9])) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) sum += Number(digits[i]) * (11 - i);
  let d2 = (sum * 10) % 11;
  if (d2 === 10) d2 = 0;
  return d2 === Number(digits[10]);
}

export const cpfSchema = z
  .string()
  .min(1, "CPF obrigatório")
  .transform(onlyDigits)
  .refine((v) => v.length === 11, "CPF deve ter 11 dígitos")
  .refine(isValidCPF, "CPF inválido");

export const cepSchema = z
  .string()
  .min(1, "CEP obrigatório")
  .transform(onlyDigits)
  .refine((v) => v.length === 8, "CEP deve ter 8 dígitos");

export const telefoneSchema = z
  .string()
  .min(1, "Telefone obrigatório")
  .transform(onlyDigits)
  .refine((v) => v.length >= 10 && v.length <= 11, "Telefone inválido");

export const telefoneOpcionalSchema = z
  .string()
  .optional()
  .transform((v) => (v ? onlyDigits(v) : ""))
  .refine((v) => !v || (v.length >= 10 && v.length <= 11), "Telefone inválido");

export const uuidRequired = (label: string) =>
  z.string().min(1, `${label} obrigatório`).uuid(`${label} inválido`);

export const nomeSchema = z
  .string()
  .trim()
  .min(3, "Nome deve ter no mínimo 3 caracteres")
  .max(200, "Nome muito longo");

export const emailSchema = z
  .string()
  .trim()
  .email("E-mail inválido");

export const emailOpcionalSchema = z
  .string()
  .optional()
  .transform((v) => v?.trim() ?? "")
  .refine((v) => !v || z.string().email().safeParse(v).success, "E-mail inválido");
