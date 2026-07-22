/** Course Intro Management Table catalog — stored on course workspace item metadata. */

export type CourseTableVisibility = "self_owned" | "sharable";

export type CourseTableEntry = Readonly<{
  id: string;
  instanceId: string;
  definitionId: string;
  title: string;
  visibility: CourseTableVisibility;
  templateLabel: string;
  createdByName: string;
  createdAt: string;
}>;

export function parseCourseTablesFromMetadata(
  metadata: Record<string, unknown> | null | undefined,
): CourseTableEntry[] {
  const raw = metadata?.courseTables ?? metadata?.course_tables;
  if (!Array.isArray(raw)) return [];
  return raw
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
    }))
    .filter((e) => e.instanceId);
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
