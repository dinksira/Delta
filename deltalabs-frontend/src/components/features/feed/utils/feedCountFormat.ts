/** Shared count formatting for feed rails and API mapping (no UI). */

export function formatCompactCount(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return `${value}`;
}

export function parseCompactCountLabel(value: string | number | undefined): number {
  if (typeof value === "number") return Number.isFinite(value) ? Math.max(0, Math.round(value)) : 0;
  if (!value) return 0;
  const sanitized = value.trim().replace(/,/g, "");
  const match = sanitized.match(/^(\d+(?:\.\d+)?)([kKmM])?$/);
  if (!match) return Number.parseInt(sanitized, 10) || 0;
  const base = Number.parseFloat(match[1] ?? "0");
  const suffix = (match[2] ?? "").toLowerCase();
  if (suffix === "m") return Math.round(base * 1_000_000);
  if (suffix === "k") return Math.round(base * 1_000);
  return Math.round(base);
}
