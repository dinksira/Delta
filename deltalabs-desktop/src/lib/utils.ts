import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * cn
 * Utility function to merge Tailwind CSS classes dynamically.
 *
 * @param inputs - Array of class values to merge.
 * @returns Merged class string.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
