import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value)
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('pt-BR').format(d)
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short'
  }).format(d)
}

// Máscara para CNPJ: XX.XXX.XXX/XXXX-XX
export function formatCNPJ(value: string): string {
  // Remove tudo que não é dígito
  const cleaned = value.replace(/\D/g, '')
  
  // Aplica a máscara progressivamente
  if (cleaned.length <= 2) {
    return cleaned
  } else if (cleaned.length <= 5) {
    return `${cleaned.slice(0, 2)}.${cleaned.slice(2)}`
  } else if (cleaned.length <= 8) {
    return `${cleaned.slice(0, 2)}.${cleaned.slice(2, 5)}.${cleaned.slice(5)}`
  } else if (cleaned.length <= 12) {
    return `${cleaned.slice(0, 2)}.${cleaned.slice(2, 5)}.${cleaned.slice(5, 8)}/${cleaned.slice(8)}`
  } else {
    return `${cleaned.slice(0, 2)}.${cleaned.slice(2, 5)}.${cleaned.slice(5, 8)}/${cleaned.slice(8, 12)}-${cleaned.slice(12, 14)}`
  }
}

// Máscara para telefone: (XX) XXXXX-XXXX ou (XX) XXXX-XXXX
export function formatPhone(value: string): string {
  // Remove tudo que não é dígito
  const cleaned = value.replace(/\D/g, '')
  
  // Aplica a máscara progressivamente
  if (cleaned.length <= 2) {
    return cleaned
  } else if (cleaned.length <= 6) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2)}`
  } else if (cleaned.length <= 10) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`
  } else {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7, 11)}`
  }
}

// Limpa os dados das máscaras para armazenar apenas números
export function cleanCNPJ(value: string): string {
  return value.replace(/\D/g, '')
}

export function cleanPhone(value: string): string {
  return value.replace(/\D/g, '')
}
