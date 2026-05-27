import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

// Combines clsx + tailwind-merge so conditional classes never conflict
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
