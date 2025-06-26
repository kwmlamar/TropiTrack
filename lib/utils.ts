import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Escape special characters for PostgreSQL ILIKE queries
 * This prevents parsing errors when searching for strings containing special characters like #, %, _, etc.
 */
export function escapeSearchTerm(searchTerm: string): string {
  return searchTerm
    .replace(/[#%_]/g, (match) => `\\${match}`) // Escape #, %, and _ characters
    .replace(/[\\]/g, '\\\\'); // Escape backslashes
}
