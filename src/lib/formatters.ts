export function onlyDigits(value: string): string {
  return value.replace(/\D/g, "");
}

export function maskCPF(value: string): string {
  return onlyDigits(value)
    .slice(0, 11)
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

export function formatCPF(cpf: string): string {
  const d = onlyDigits(cpf);
  if (d.length !== 11) return cpf;
  return maskCPF(d);
}

export function maskCEP(value: string): string {
  return onlyDigits(value)
    .slice(0, 8)
    .replace(/(\d{5})(\d{1,3})/, "$1-$2");
}

export function maskPhone(value: string): string {
  const d = onlyDigits(value).slice(0, 11);
  if (d.length <= 10) {
    return d
      .replace(/(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{4})(\d{1,4})/, "$1-$2");
  }
  return d
    .replace(/(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d{1,4})/, "$1-$2");
}

export function maskRG(value: string): string {
  return onlyDigits(value)
    .slice(0, 9)
    .replace(/(\d{2})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

export function maskTituloEleitor(value: string): string {
  return onlyDigits(value)
    .slice(0, 12)
    .replace(/(\d{4})(\d)/, "$1 $2")
    .replace(/(\d{4})\s(\d{4})(\d)/, "$1 $2 $3");
}

export function maskSecao(value: string): string {
  return onlyDigits(value).slice(0, 4);
}
