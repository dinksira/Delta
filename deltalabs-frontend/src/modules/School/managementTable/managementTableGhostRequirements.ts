/** Ghost ops MT — Requirements cell encodes `fileName||mediaId` segments joined by ` ;; `. */

export type GhostRequirementRef = Readonly<{
  fileName: string;
  mediaId: string | null;
}>;

export function parseGhostRequirementCell(value: unknown): GhostRequirementRef[] {
  if (value === null || value === undefined || value === "") return [];
  if (typeof value !== "string") return [{ fileName: String(value), mediaId: null }];
  const raw = value.trim();
  if (!raw) return [];

  const segments = raw.includes(" ;; ")
    ? raw.split(" ;; ").map((s) => s.trim()).filter(Boolean)
    : raw.includes("||")
      ? [raw]
      : raw.split(",").map((s) => s.trim()).filter(Boolean);

  return segments.map((seg) => {
    const sep = seg.indexOf("||");
    if (sep > 0) {
      return {
        fileName: seg.slice(0, sep).trim() || "file",
        mediaId: seg.slice(sep + 2).trim() || null,
      };
    }
    return { fileName: seg, mediaId: null };
  });
}

export function isGhostRequirementsColumn(title: string): boolean {
  return title.trim().toLowerCase() === "requirements";
}
