"use client";

/** Setup modal: tab name + entry point to the centered filter modal. */
import { Button, DialogOverlay, DialogPanel, Typography } from "@/components/theme";
import type { FeedMessages } from "@/i18n/feedMessages";
import {
  feedSelectionHasActiveFilters,
  normalizeFeedQuerySelection,
  type FeedClipFilterSelection,
} from "@/modules/Feed/types/feedClipFilters";
import { summarizeCustomFeedFilters } from "@/modules/Feed/utils/summarizeCustomFeedFilters";

type CustomFeedSetupModalProps = Readonly<{
  open: boolean;
  label: string;
  filters: FeedClipFilterSelection;
  browse: FeedMessages["browseCategories"];
  copy: FeedMessages["customTab"];
  saving?: boolean;
  validationError?: string | null;
  onLabelChange: (value: string) => void;
  onOpenFilters: () => void;
  onSave: () => void;
  onClose: () => void;
}>;

export function CustomFeedSetupModal({
  open,
  label,
  filters,
  browse,
  copy,
  saving = false,
  validationError,
  onLabelChange,
  onOpenFilters,
  onSave,
  onClose,
}: CustomFeedSetupModalProps) {
  if (!open) return null;

  const normalized = normalizeFeedQuerySelection(filters);
  const hasFilters = feedSelectionHasActiveFilters(normalized);
  const summary = hasFilters ? summarizeCustomFeedFilters(normalized, browse, copy) : null;

  return (
    <>
      <DialogOverlay className="z-[1400]" onClose={onClose} />
      <div className="fixed inset-0 z-[1410] flex items-center justify-center p-4 sm:p-6">
        <DialogPanel
          className="w-full max-w-md overflow-hidden shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-6 pb-5 pt-6">
            <Typography as="h2" variant="h2" className="text-xl font-semibold tracking-tight text-text-primary">
              {copy.setupTitle}
            </Typography>
            <Typography variant="body" className="mt-2 text-sm leading-relaxed text-text-secondary">
              {copy.setupDescription}
            </Typography>
          </div>

          <div className="space-y-5 px-6 pb-6">
            <label className="flex flex-col gap-2">
              <Typography variant="label" as="span" className="text-text-primary">
                {copy.tabNameLabel}
              </Typography>
              <input
                type="text"
                maxLength={24}
                value={label}
                onChange={(e) => onLabelChange(e.target.value)}
                placeholder={copy.tabNamePlaceholder}
                className="min-h-11 w-full rounded-xl border border-border-default bg-surface px-3.5 text-sm text-text-primary shadow-sm outline-none transition-shadow placeholder:text-text-secondary/60 focus-visible:border-primary-400 focus-visible:ring-2 focus-visible:ring-primary-500/25"
              />
            </label>

            {summary ? (
              <p className="rounded-xl border border-primary-100 bg-primary-50/60 px-3.5 py-2.5 text-sm text-primary-900">
                <span className="font-medium">{copy.filtersSelectedLabel}: </span>
                {summary}
              </p>
            ) : null}

            <div className="flex flex-wrap items-center gap-2.5">
              <Button type="button" variant="secondary" size="md" onClick={onOpenFilters}>
                {browse.filtersAria}
              </Button>
              <Button type="button" size="md" disabled={saving} onClick={onSave}>
                {saving ? copy.savingButton : copy.saveButton}
              </Button>
            </div>

            {validationError ? (
              <p className="text-sm text-error-600" role="alert">
                {validationError}
              </p>
            ) : null}
          </div>
        </DialogPanel>
      </div>
    </>
  );
}
