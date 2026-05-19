import type { ClassSessionTypeDto } from "@/modules/School/api";

export function sessionTypeLabel(t: ClassSessionTypeDto): string {
  if (t === "in_person") return "In person";
  if (t === "hybrid") return "Hybrid";
  return "Virtual";
}

export function formatClassSessionDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "—";
    return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(d);
  } catch {
    return "—";
  }
}
