"use client";

/** Centered modal for choosing custom-tab feed filters (not the left-rail panel). */
import { useEffect, useState } from "react";

import { Button, DialogOverlay, DialogPanel, Typography } from "@/components/theme";
import { cx } from "@/components/features/feed/primitives";
import type { FeedMessages } from "@/i18n/feedMessages";
import type {
  FeedClipFilterSelection,
  FeedContentModality,
  FeedCourseCategory,
  FeedDurationBucket,
} from "@/modules/Feed/types/feedClipFilters";

type CustomFeedFilterModalProps = Readonly<{
  open: boolean;
  appliedSelection: FeedClipFilterSelection;
  browse: FeedMessages["browseCategories"];
  copy: FeedMessages["customTab"];
  onApply: (selection: FeedClipFilterSelection) => void;
  onClose: () => void;
}>;

const MODALITY_CHIPS: readonly { value: FeedContentModality; labelKey: "all" | "video" | "audio" | "simulation" }[] = [
  { value: "all", labelKey: "all" },
  { value: "video", labelKey: "video" },
  { value: "audio", labelKey: "audio" },
  { value: "simulation", labelKey: "simulation" },
];

const COURSE_CHIPS: readonly { value: FeedCourseCategory; labelKey: string }[] = [
  { value: "all", labelKey: "all" },
  { value: "research", labelKey: "research" },
  { value: "lab", labelKey: "lab" },
  { value: "course", labelKey: "course" },
];

const DURATION_CHIPS: readonly { value: FeedDurationBucket; labelKey: keyof FeedMessages["customTab"] }[] = [
  { value: "short", labelKey: "durationShort" },
  { value: "medium", labelKey: "durationMedium" },
  { value: "long", labelKey: "durationLong" },
];

const TOPIC_CHIPS = [
  { value: "DeltaLabs", label: "DeltaLabs" },
  { value: "NeuroTech", label: "NeuroTech" },
  { value: "LabSkills", label: "Lab skills" },
  { value: "Feed", label: "Feed" },
] as const;

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
        "inline-flex min-h-9 items-center justify-center rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors",
        selected
          ? "border-primary-500 bg-primary-50 text-primary-900 shadow-sm"
          : "border-border-default bg-surface-muted text-text-secondary hover:border-border-strong hover:bg-surface-default hover:text-text-primary",
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

const COURSE_LABELS: Record<Exclude<FeedCourseCategory, "all">, string> = {
  research: "Research",
  lab: "Lab",
  course: "Course",
};

export function CustomFeedFilterModal({
  open,
  appliedSelection,
  browse,
  copy,
  onApply,
  onClose,
}: CustomFeedFilterModalProps) {
  const [draft, setDraft] = useState<FeedClipFilterSelection>(() => cloneSelection(appliedSelection));

  useEffect(() => {
    if (!open) return;
    setDraft(cloneSelection(appliedSelection));
  }, [open, appliedSelection]);

  if (!open) return null;

  const hashtagDraft = draft.hashtag?.trim() ?? "";

  return (
    <>
      <DialogOverlay className="z-[1450]" onClose={onClose} />
      <div className="fixed inset-0 z-[1460] flex items-center justify-center p-4 sm:p-6">
        <DialogPanel
          className="flex max-h-[min(90vh,44rem)] w-full max-w-lg flex-col overflow-hidden shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="shrink-0 border-b border-border-default px-6 pb-4 pt-6">
            <Typography as="h2" variant="h2" className="text-xl font-semibold tracking-tight text-text-primary">
              {copy.filterModalTitle}
            </Typography>
            <Typography variant="body" className="mt-1.5 text-sm text-text-secondary">
              {copy.filterModalDescription}
            </Typography>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-6 py-5">
            <div className="space-y-5">
              <div className="space-y-2.5">
                <Typography as="p" variant="label" className="text-text-primary">
                  {copy.contentTypeLabel}
                </Typography>
                <div className="flex flex-wrap gap-2" role="group" aria-label={copy.contentTypeLabel}>
                  {MODALITY_CHIPS.map((chip) => (
                    <ChipButton
                      key={chip.value}
                      label={browse[chip.labelKey]}
                      selected={draft.modality === chip.value}
                      onClick={() => setDraft((prev) => toggleField(prev, "modality", chip.value))}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-2.5">
                <Typography as="p" variant="label" className="text-text-primary">
                  {copy.topicLabel}
                </Typography>
                <div className="flex flex-wrap gap-2" role="group" aria-label={copy.topicLabel}>
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

              <div className="space-y-2.5">
                <Typography as="p" variant="label" className="text-text-primary">
                  {copy.courseTypeLabel}
                </Typography>
                <div className="flex flex-wrap gap-2" role="group" aria-label={copy.courseTypeLabel}>
                  {COURSE_CHIPS.map((chip) => (
                    <ChipButton
                      key={chip.value}
                      label={
                        chip.value === "all" ? copy.courseAllLabel : COURSE_LABELS[chip.value as keyof typeof COURSE_LABELS]
                      }
                      selected={draft.courseCategory === chip.value}
                      onClick={() => setDraft((prev) => toggleField(prev, "courseCategory", chip.value))}
                    />
                  ))}
                </div>
              </div>

              <div className="space-y-2.5">
                <Typography as="p" variant="label" className="text-text-primary">
                  {copy.lengthLabel}
                </Typography>
                <div className="flex flex-wrap gap-2" role="group" aria-label={copy.lengthLabel}>
                  {DURATION_CHIPS.map((chip) => (
                    <ChipButton
                      key={chip.value}
                      label={copy[chip.labelKey]}
                      selected={draft.duration === chip.value}
                      onClick={() => setDraft((prev) => toggleField(prev, "duration", chip.value))}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="flex shrink-0 flex-col gap-2 border-t border-border-default bg-surface-default px-6 py-4 sm:flex-row sm:justify-end">
            <Button type="button" variant="secondary" className="w-full sm:w-auto" onClick={onClose}>
              {copy.filterCancelButton}
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="w-full sm:w-auto"
              onClick={() => setDraft({})}
            >
              {copy.filterClearButton}
            </Button>
            <Button
              type="button"
              className="w-full sm:w-auto"
              onClick={() => {
                onApply(cloneSelection(draft));
                onClose();
              }}
            >
              {copy.filterApplyButton}
            </Button>
          </div>
        </DialogPanel>
      </div>
    </>
  );
}
