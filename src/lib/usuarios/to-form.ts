import { maskCPF, maskPhone } from "@/lib/formatters";
import type { UsuarioUpdateInput } from "@/lib/validators/usuario";

export function usuarioToFormInput(u: {
  nome_completo: string;
  email: string;
  telefone: string | null;
  cpf: string | null;
  perfil_id: string;
  status: string;
}): UsuarioUpdateInput {
  return {
    nome_completo: u.nome_completo,
    email: u.email,
    telefone: u.telefone ? maskPhone(u.telefone) : "",
    cpf: u.cpf ? maskCPF(u.cpf) : "",
    perfil_id: u.perfil_id,
    status: u.status as UsuarioUpdateInput["status"],
    password: "",
  };
}
