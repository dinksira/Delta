/** Course Management Table catalog — stored on course workspace item metadata. */

export type CourseTableVisibility = "self_owned" | "sharable";

/** Which course nav owns this catalog entry. Legacy rows without surface = exercise. */
export type CourseTableSurface = "exercise" | "summary" | "score" | "supplement";

export type CourseTableEntry = Readonly<{
  id: string;
  instanceId: string;
  definitionId: string;
  title: string;
  visibility: CourseTableVisibility;
  templateLabel: string;
  createdByName: string;
  createdAt: string;
  surface: CourseTableSurface;
}>;

function normalizeSurface(raw: unknown): CourseTableSurface {
  const s = String(raw ?? "").trim();
  if (s === "summary") return "summary";
  if (s === "score") return "score";
  if (s === "supplement") return "supplement";
  return "exercise";
}

export function parseCourseTablesFromMetadata(
  metadata: Record<string, unknown> | null | undefined,
  surface?: CourseTableSurface,
): CourseTableEntry[] {
  const raw = metadata?.courseTables ?? metadata?.course_tables;
  if (!Array.isArray(raw)) return [];
  const all = raw
    .filter((e): e is Record<string, unknown> => !!e && typeof e === "object" && !Array.isArray(e))
    .map((e): CourseTableEntry => ({
      id: String(e.id ?? e.instanceId ?? e.instance_id ?? ""),
      instanceId: String(e.instanceId ?? e.instance_id ?? ""),
      definitionId: String(e.definitionId ?? e.definition_id ?? ""),
      title: String(e.title ?? "Untitled table"),
      visibility:
        String(e.visibility ?? "self_owned") === "sharable"
          ? ("sharable" as const)
          : ("self_owned" as const),
      templateLabel: String(e.templateLabel ?? e.template_label ?? "Template Based"),
      createdByName: String(e.createdByName ?? e.created_by_name ?? "You"),
      createdAt: String(e.createdAt ?? e.created_at ?? new Date().toISOString()),
      surface: normalizeSurface(e.surface),
    }))
    .filter((e) => e.instanceId);
  if (!surface) return all;
  return all.filter((e) => e.surface === surface);
}

/** Merge one surface's tables into full metadata without wiping the other surface. */
export function mergeCourseTablesForSurface(
  metadata: Record<string, unknown> | null | undefined,
  surface: CourseTableSurface,
  surfaceTables: readonly CourseTableEntry[],
): CourseTableEntry[] {
  const others = parseCourseTablesFromMetadata(metadata).filter((t) => t.surface !== surface);
  const tagged = surfaceTables.map((t) => ({ ...t, surface }));
  return [...tagged, ...others];
}

export function courseTablesToMetadataPatch(
  tables: readonly CourseTableEntry[],
): Record<string, unknown> {
  const primary = tables[0];
  return {
    courseTables: tables.map((t) => ({ ...t })),
    ...(primary
      ? {
          managementTableInstanceId: primary.instanceId,
          managementTableDefinitionId: primary.definitionId,
        }
      : {}),
  };
}

export function relativeTimeLabel(iso: string): string {
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return "";
  const diffSec = Math.max(0, Math.round((Date.now() - t) / 1000));
  if (diffSec < 60) return "just now";
  if (diffSec < 3600) {
    const m = Math.round(diffSec / 60);
    return `${m} minute${m === 1 ? "" : "s"} ago`;
  }
  if (diffSec < 86400) {
    const h = Math.round(diffSec / 3600);
    return `${h} hour${h === 1 ? "" : "s"} ago`;
  }
  const d = Math.round(diffSec / 86400);
  return `${d} day${d === 1 ? "" : "s"} ago`;
}

/** Ghost resource kinds that belong on Exercise & Test Ghost Ops. */
export function isExerciseGhostResourceKind(kind: string): boolean {
  const k = kind.trim().toLowerCase();
  if (!k || k === "fast_summary") return false;
  return true;
}

export function isSummaryGhostResourceKind(kind: string): boolean {
  return kind.trim().toLowerCase() === "fast_summary";
}
