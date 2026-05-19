"use client";

/** ################################ IMPORT ############################# */
/** Imports used by this file. */
import { useEffect, useState } from "react";

import { Typography } from "@/components/theme";
import { cx } from "@/components/theme/utils";
import type {
  FeedClipFilterSelection,
  FeedContentModality,
  FeedCourseCategory,
  FeedDurationBucket,
} from "@/modules/Feed/types/feedClipFilters";
/** ################################ /IMPORT ############################# */

/** ################################ TYPES ############################# */
type FeedClipFilterPanelProps = Readonly<{
  id: string;
  open: boolean;
  appliedSelection: FeedClipFilterSelection;
  onApply: (selection: FeedClipFilterSelection) => void;
  onDismiss: () => void;
}>;
/** ################################ /TYPES ############################# */

/** ################################ CONSTANTS ############################# */
const MODALITY_CHIPS: readonly { value: FeedContentModality; label: string }[] = [
  { value: "all", label: "All types" },
  { value: "video", label: "Video" },
  { value: "audio", label: "Audio" },
  { value: "simulation", label: "Simulation" },
];

const COURSE_CHIPS: readonly { value: FeedCourseCategory; label: string }[] = [
  { value: "all", label: "All courses" },
  { value: "research", label: "Research" },
  { value: "lab", label: "Lab" },
  { value: "course", label: "Course" },
];

const DURATION_CHIPS: readonly { value: FeedDurationBucket; label: string }[] = [
  { value: "short", label: "Under 1.5 min" },
  { value: "medium", label: "1.5–5 min" },
  { value: "long", label: "Over 5 min" },
];

const TOPIC_CHIPS = [
  { value: "DeltaLabs", label: "DeltaLabs" },
  { value: "NeuroTech", label: "NeuroTech" },
  { value: "LabSkills", label: "Lab skills" },
  { value: "Feed", label: "Feed" },
] as const;
/** ################################ /CONSTANTS ############################# */

/** ################################ HELPERS ############################# */
function cloneSelection(value: FeedClipFilterSelection): FeedClipFilterSelection {
  return { ...value };
}

function ChipButton({
  selected,
  label,
  onClick,
}: Readonly<{
  selected: boolean;
  label: string;
  onClick: () => void;
}>) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cx(
        "inline-flex min-h-9 items-center justify-center rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
        selected
          ? "border-primary-500 bg-primary-50 text-primary-900"
          : "border-border-default bg-surface-muted text-text-secondary hover:border-border-strong hover:text-text-primary",
      )}
    >
      {label}
    </button>
  );
}

function toggleField<T extends string>(
  prev: FeedClipFilterSelection,
  key: keyof FeedClipFilterSelection,
  value: T,
): FeedClipFilterSelection {
  const current = prev[key];
  if (current === value) {
    const next = { ...prev };
    delete next[key];
    return next;
  }
  return { ...prev, [key]: value };
}
/** ################################ /HELPERS ############################# */

/** ################################ COMPONENT ############################# */
/** Chip rail; Apply updates the main feed query (vertical feed stays). */
export function FeedClipFilterPanel({ id, open, appliedSelection, onApply, onDismiss }: FeedClipFilterPanelProps) {
  const [draft, setDraft] = useState<FeedClipFilterSelection>(() => cloneSelection(appliedSelection));

  useEffect(() => {
    if (!open) return;
    setDraft(cloneSelection(appliedSelection));
  }, [open, appliedSelection]);

  if (!open) {
    return null;
  }

  const hashtagDraft = draft.hashtag?.trim() ?? "";

  return (
    <section
      id={id}
      aria-label="Feed filters"
      className="mt-2 flex max-h-[min(72vh,36rem)] min-h-0 flex-col overflow-hidden rounded-2xl border border-border-default bg-surface-default shadow-sm"
    >
      <Typography as="h2" variant="label" className="shrink-0 px-4 pt-4 text-text-primary">
        Filters
      </Typography>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-3">
        <div className="space-y-4">
          <div className="space-y-2">
            <Typography as="p" variant="label" className="text-text-secondary">
              Content type
            </Typography>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Content type">
              {MODALITY_CHIPS.map((chip) => (
                <ChipButton
                  key={chip.value}
                  label={chip.label}
                  selected={draft.modality === chip.value}
                  onClick={() => setDraft((prev) => toggleField(prev, "modality", chip.value))}
                />
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Typography as="p" variant="label" className="text-text-secondary">
              Topic
            </Typography>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Topic">
              {TOPIC_CHIPS.map((chip) => (
                <ChipButton
                  key={chip.value}
                  label={chip.label}
                  selected={hashtagDraft.toLowerCase() === chip.value.toLowerCase()}
                  onClick={() =>
                    setDraft((prev) => {
                      const h = prev.hashtag?.trim() ?? "";
                      if (h.toLowerCase() === chip.value.toLowerCase()) {
                        const next = { ...prev };
                        delete next.hashtag;
                        return next;
                      }
                      return { ...prev, hashtag: chip.value };
                    })
                  }
                />
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Typography as="p" variant="label" className="text-text-secondary">
              Course type
            </Typography>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Course type">
              {COURSE_CHIPS.map((chip) => (
                <ChipButton
                  key={chip.value}
                  label={chip.label}
                  selected={draft.courseCategory === chip.value}
                  onClick={() => setDraft((prev) => toggleField(prev, "courseCategory", chip.value))}
                />
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Typography as="p" variant="label" className="text-text-secondary">
              Length
            </Typography>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Video length">
              {DURATION_CHIPS.map((chip) => (
                <ChipButton
                  key={chip.value}
                  label={chip.label}
                  selected={draft.duration === chip.value}
                  onClick={() => setDraft((prev) => toggleField(prev, "duration", chip.value))}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex shrink-0 flex-col gap-2 border-t border-border-default bg-surface-default px-4 py-3">
        <button
          type="button"
          className="inline-flex h-10 w-full items-center justify-center rounded-lg border border-border-default text-sm font-semibold text-text-primary transition-colors hover:bg-surface-muted"
          onClick={onDismiss}
        >
          Cancel
        </button>
        <button
          type="button"
          className="inline-flex h-10 w-full items-center justify-center rounded-lg border border-border-default text-sm font-semibold text-text-primary transition-colors hover:bg-surface-muted"
          onClick={() => setDraft({})}
        >
          Clear all
        </button>
        <button
          type="button"
          className="inline-flex h-10 w-full items-center justify-center rounded-lg bg-primary-600 text-sm font-semibold text-white transition-colors hover:bg-primary-700"
          onClick={() => {
            onApply(cloneSelection(draft));
          }}
        >
          Apply
        </button>
      </div>
    </section>
  );
}
/** ################################ /COMPONENT ############################# */
