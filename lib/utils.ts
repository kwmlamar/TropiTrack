import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Get the current date in the user's local timezone
 * This ensures we're working with the correct day regardless of server timezone
 * @returns Date object representing today in the user's local timezone
 */
export function getCurrentLocalDate(): Date {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), now.getDate())
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
