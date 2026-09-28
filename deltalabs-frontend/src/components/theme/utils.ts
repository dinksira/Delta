/** ################################ COMPONENT ############################# */
/** Main exported component logic for this file. */
/** Shared utility helpers for theme primitives. */
import { cn } from "@/lib/utils";

/**
 * Joins class names, resolving Tailwind conflicts so a caller's `className`
 * reliably overrides a component's defaults. Delegates to `cn` so theme
 * primitives and feature components share one merge behaviour.
 */
export function cx(...classes: Array<string | false | null | undefined>): string {
  return cn(...classes);
}
/** ################################ /COMPONENT ############################# */
