import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import {
  formatCPF,
  maskCPF,
  maskCEP,
  maskPhone,
  maskRG,
  maskTituloEleitor,
  maskSecao,
} from "@/lib/formatters";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export {
  formatCPF,
  maskCPF,
  maskCEP,
  maskPhone,
  maskRG,
  maskTituloEleitor,
  maskSecao,
};

export function formatPhone(phone: string): string {
  return maskPhone(phone);
}
