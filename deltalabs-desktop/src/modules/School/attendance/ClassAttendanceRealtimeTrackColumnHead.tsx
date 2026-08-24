"use client";

import { ChevronDown, Settings2 } from "lucide-react";
import { useEffect, useRef, useState, type RefObject } from "react";
import { createPortal } from "react-dom";

import { Button } from "@/components/theme";
import type { AttendanceRealtimeTrackConfig } from "@/modules/School/attendance/attendanceColumnConfig";
import { ClassAttendanceFaceDetectionModal } from "@/modules/School/attendance/ClassAttendanceFaceDetectionModal";

function RealtimeTrackPopover({
  open,
  onClose,
  anchorRef,
  config,
  canMutate,
  onChange,
  onOpenFaceSettings,
}: Readonly<{
  open: boolean;
  onClose: () => void;
  anchorRef: RefObject<HTMLButtonElement | null>;
  config: AttendanceRealtimeTrackConfig;
  canMutate: boolean;
  onChange: (next: AttendanceRealtimeTrackConfig) => void;
  onOpenFaceSettings: () => void;
}>) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => {
    if (!open || !anchorRef.current) return;
    const rect = anchorRef.current.getBoundingClientRect();
    setPos({ top: rect.bottom + 6, left: Math.max(8, rect.right - 260) });
  }, [anchorRef, open]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (panelRef.current?.contains(t) || anchorRef.current?.contains(t)) return;
      onClose();
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [anchorRef, onClose, open]);

  if (!open || !pos || typeof document === "undefined") return null;

  const setFlag = (key: keyof AttendanceRealtimeTrackConfig, value: boolean) => {
    if (!canMutate) return;
    onChange({ ...config, [key]: value });
  };

  return createPortal(
    <div
      ref={panelRef}
      role="dialog"
      aria-label="Real-time tracking settings"
      className="fixed z-[210] w-[min(16rem,calc(100vw-1rem))] rounded-xl border border-border-default bg-[#eef2f6] p-3 shadow-xl"
      style={{ top: pos.top, left: pos.left }}
    >
      <div className="flex items-center justify-between gap-2 border-b border-border-default/60 pb-2">
        <span className="text-sm font-semibold text-text-primary">Real-time tracking</span>
        <label className="inline-flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            className="peer sr-only"
            checked={config.enabled}
            disabled={!canMutate}
            onChange={(e) => setFlag("enabled", e.target.checked)}
          />
          <span
            className={[
              "relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors",
              config.enabled ? "bg-primary-600" : "bg-border-default",
            ].join(" ")}
          >
            <span
              className={[
                "absolute top-0.5 size-4 rounded-full bg-white shadow transition-transform",
                config.enabled ? "translate-x-4" : "translate-x-0.5",
              ].join(" ")}
            />
          </span>
        </label>
      </div>

      <ul className="mt-2 space-y-1">
        <li>
          <label className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm text-text-primary hover:bg-white/60">
            <input
              type="checkbox"
              checked={config.faceDetection}
              disabled={!canMutate || !config.enabled}
              onChange={(e) => setFlag("faceDetection", e.target.checked)}
            />
            Face Detection
          </label>
        </li>
        <li>
          <label className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm text-text-primary hover:bg-white/60">
            <input
              type="checkbox"
              checked={config.voiceRecognition}
              disabled={!canMutate || !config.enabled}
              onChange={(e) => setFlag("voiceRecognition", e.target.checked)}
            />
            Voice Recognition
          </label>
        </li>
      </ul>

      <p className="mt-2 px-2 text-[11px] font-medium text-text-tertiary">Record option</p>
      <ul className="space-y-1">
        <li>
          <label className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm text-text-primary hover:bg-white/60">
            <input
              type="checkbox"
              checked={config.recordVideo}
              disabled={!canMutate || !config.enabled}
              onChange={(e) => setFlag("recordVideo", e.target.checked)}
            />
            Video
          </label>
        </li>
        <li>
          <label className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm text-text-primary hover:bg-white/60">
            <input
              type="checkbox"
              checked={config.recordAudio}
              disabled={!canMutate || !config.enabled}
              onChange={(e) => setFlag("recordAudio", e.target.checked)}
            />
            Audio
          </label>
        </li>
      </ul>

      {config.faceDetection && config.enabled ? (
        <button
          type="button"
          className="mt-2 inline-flex w-full items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium text-primary-700 hover:bg-white/60"
          onClick={() => {
            onClose();
            onOpenFaceSettings();
          }}
        >
          <Settings2 className="size-3.5" aria-hidden />
          Face detection settings
        </button>
      ) : null}

      <div className="mt-2 flex justify-end">
        <Button type="button" variant="secondary" size="sm" onClick={onClose}>
          Done
        </Button>
      </div>
    </div>,
    document.body,
  );
}

export function ClassAttendanceRealtimeTrackColumnHead({
  config,
  canMutate,
  onChange,
  onSaveFaceSettings,
}: Readonly<{
  config: AttendanceRealtimeTrackConfig;
  canMutate: boolean;
  onChange: (next: AttendanceRealtimeTrackConfig) => void;
  onSaveFaceSettings: (settings: AttendanceRealtimeTrackConfig["faceDetectionSettings"]) => void;
}>) {
  const anchorRef = useRef<HTMLButtonElement | null>(null);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [faceModalOpen, setFaceModalOpen] = useState(false);

  return (
    <>
      <button
        ref={anchorRef}
        type="button"
        onClick={() => setPopoverOpen(true)}
        className="flex w-full min-h-[2.25rem] flex-col items-start gap-0.5 px-2 py-1.5 text-left transition-colors hover:bg-white/50"
        title="Configure real-time attendance tracking"
      >
        <span className="inline-flex items-center gap-1 text-xs font-medium text-text-secondary">
          Realtime track
          <ChevronDown className="size-3" aria-hidden />
        </span>
        <span className="text-[10px] text-text-tertiary">
          {config.enabled ? "On" : "Off"}
          {config.enabled && config.faceDetection ? " · Face" : ""}
          {config.enabled && config.voiceRecognition ? " · Voice" : ""}
        </span>
      </button>

      <RealtimeTrackPopover
        open={popoverOpen}
        onClose={() => setPopoverOpen(false)}
        anchorRef={anchorRef}
        config={config}
        canMutate={canMutate}
        onChange={onChange}
        onOpenFaceSettings={() => setFaceModalOpen(true)}
      />

      <ClassAttendanceFaceDetectionModal
        open={faceModalOpen}
        onClose={() => setFaceModalOpen(false)}
        settings={config.faceDetectionSettings}
        onSave={onSaveFaceSettings}
      />
    </>
  );
}

/** Per-row realtime track cell — shows activity when tracking is enabled. */
export function ClassAttendanceRealtimeTrackCell({
  config,
  hasActivity,
}: Readonly<{
  config: AttendanceRealtimeTrackConfig;
  hasActivity: boolean;
}>) {
  if (!config.enabled) {
    return (
      <div className="h-7 min-w-[7rem] rounded-md bg-surface-muted/40" title="Enable real-time tracking in column header" />
    );
  }

  const modes = [
    config.faceDetection ? "Face" : null,
    config.voiceRecognition ? "Voice" : null,
  ]
    .filter(Boolean)
    .join(" + ");

  return (
    <div
      className={[
        "flex h-7 min-w-[7rem] items-center rounded-md px-2",
        hasActivity ? "bg-[#c5d0dc]" : "bg-[#e8edf3]",
      ].join(" ")}
      title={modes ? `Tracking: ${modes}` : "Realtime tracking enabled"}
    >
      {hasActivity ? (
        <span className="truncate text-[10px] font-medium text-text-secondary">Recorded</span>
      ) : (
        <span className="truncate text-[10px] text-text-tertiary">Waiting…</span>
      )}
    </div>
  );
}
