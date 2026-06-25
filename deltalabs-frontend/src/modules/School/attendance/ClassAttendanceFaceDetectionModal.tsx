"use client";

import { Settings2, X } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/theme";
import type { AttendanceFaceDetectionSettings, AttendanceFaceTrackOption } from "@/modules/School/attendance/attendanceColumnConfig";

export function ClassAttendanceFaceDetectionModal({
  open,
  onClose,
  settings,
  onSave,
}: Readonly<{
  open: boolean;
  onClose: () => void;
  settings: AttendanceFaceDetectionSettings;
  onSave: (next: AttendanceFaceDetectionSettings) => void;
}>) {
  const [draft, setDraft] = useState(settings);

  useEffect(() => {
    if (open) setDraft(settings);
  }, [open, settings]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[220] flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-labelledby="face-detection-modal-title">
      <div className="w-full max-w-lg rounded-xl border border-border-default bg-surface-default shadow-xl">
        <div className="flex items-start justify-between gap-3 border-b border-border-default px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="inline-flex size-10 items-center justify-center rounded-lg bg-primary-50 text-primary-700" aria-hidden>
              <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.75">
                <circle cx="12" cy="10" r="4" />
                <path d="M6 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
                <rect x="3" y="3" width="18" height="18" rx="3" strokeDasharray="3 2" />
              </svg>
            </span>
            <h2 id="face-detection-modal-title" className="text-lg font-semibold text-text-primary">
              Face Detection
            </h2>
          </div>
          <button type="button" onClick={onClose} className="rounded-md p-1 text-text-tertiary hover:bg-surface-muted" aria-label="Close">
            <X className="size-5" aria-hidden />
          </button>
        </div>

        <div className="space-y-4 px-5 py-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label className="text-xs font-medium text-text-secondary">
              Section
              <select
                value={draft.section}
                onChange={(e) => setDraft((d) => ({ ...d, section: e.target.value }))}
                className="mt-1 block w-full min-w-[10rem] rounded-md border border-border-default bg-surface-default px-3 py-2 text-sm"
              >
                <option value="all">All Section</option>
                <option value="main">Main Section</option>
              </select>
            </label>
            <button type="button" className="inline-flex items-center gap-1.5 text-xs font-medium text-primary-700 hover:underline">
              <Settings2 className="size-3.5" aria-hidden />
              Configure Setting
            </button>
          </div>

          <label className="block text-xs font-medium text-text-secondary">
            Track option
            <select
              value={draft.trackOption}
              onChange={(e) => setDraft((d) => ({ ...d, trackOption: e.target.value as AttendanceFaceTrackOption }))}
              className="mt-1 w-full rounded-md border border-border-default bg-surface-default px-3 py-2 text-sm"
            >
              <option value="random_sampling">Random Sampling</option>
              <option value="continuous">Continuous</option>
            </select>
          </label>

          <label className="block text-xs font-medium text-text-secondary">
            Set intervals for sampling
            <select
              value={draft.samplingIntervalMinutes}
              onChange={(e) => setDraft((d) => ({ ...d, samplingIntervalMinutes: Number(e.target.value) }))}
              disabled={draft.trackOption !== "random_sampling"}
              className="mt-1 w-full rounded-md border border-border-default bg-surface-default px-3 py-2 text-sm disabled:opacity-50"
            >
              <option value={1}>1 min</option>
              <option value={5}>5 min</option>
              <option value={10}>10 min</option>
              <option value={15}>15 min</option>
            </select>
          </label>

          <label className="block text-xs font-medium text-text-secondary">
            Presence Threshold
            <div className="mt-1 flex items-center gap-2">
              <input
                type="number"
                min={1}
                max={100}
                value={draft.presenceThresholdPercent}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, presenceThresholdPercent: Math.min(100, Math.max(1, Number(e.target.value) || 80)) }))
                }
                className="w-full rounded-md border border-border-default bg-surface-default px-3 py-2 text-sm"
              />
              <span className="text-sm text-text-tertiary">%</span>
            </div>
          </label>
        </div>

        <div className="flex justify-end gap-2 border-t border-border-default px-5 py-4">
          <Button type="button" variant="secondary" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={() => {
              onSave(draft);
              onClose();
            }}
          >
            Save
          </Button>
        </div>
      </div>
    </div>
  );
}
