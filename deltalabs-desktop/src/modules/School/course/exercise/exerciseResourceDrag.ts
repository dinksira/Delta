/** Drag payload for exercise Resources → question canvas. */
export const EXERCISE_RESOURCE_DRAG_MIME = "application/x-deltalabs-exercise-resource";

export type ExerciseResourceDragPayload = Readonly<{
  id: string;
  name: string;
  mediaId?: string;
  previewUrl?: string;
  fileName?: string;
}>;

export function encodeExerciseResourceDrag(payload: ExerciseResourceDragPayload): string {
  return JSON.stringify(payload);
}

export function parseExerciseResourceDrag(dataTransfer: DataTransfer | null): ExerciseResourceDragPayload | null {
  if (!dataTransfer) return null;
  const raw =
    dataTransfer.getData(EXERCISE_RESOURCE_DRAG_MIME) ||
    dataTransfer.getData("text/plain");
  if (!raw.trim()) return null;
  try {
    const obj = JSON.parse(raw) as Record<string, unknown>;
    if (typeof obj.id !== "string" || !obj.id.trim()) return null;
    return {
      id: obj.id.trim(),
      name: typeof obj.name === "string" ? obj.name : "Resource",
      mediaId: typeof obj.mediaId === "string" ? obj.mediaId : undefined,
      previewUrl: typeof obj.previewUrl === "string" ? obj.previewUrl : undefined,
      fileName: typeof obj.fileName === "string" ? obj.fileName : undefined,
    };
  } catch {
    return null;
  }
}

export function insertImageIntoHtml(
  html: string,
  image: { src: string; alt: string; resourceId?: string },
): string {
  const alt = image.alt.replace(/"/g, "&quot;");
  const src = image.src.replace(/"/g, "&quot;");
  const rid = image.resourceId ? ` data-ghost-resource-id="${image.resourceId.replace(/"/g, "")}"` : "";
  // Inline-block + overflow enables CSS resize handles in Chromium; user can drag to reorder in the stem.
  const img = `<p><img src="${src}" alt="${alt}"${rid} class="dl-stem-img" style="display:inline-block;max-width:100%;width:min(320px,100%);height:auto;border-radius:8px;resize:both;overflow:auto;min-width:64px;min-height:48px;vertical-align:middle;" /></p>`;
  const trimmed = html.trim();
  if (!trimmed || trimmed === "<br>" || trimmed === "<p><br></p>") return img;
  return `${html}${img}`;
}
