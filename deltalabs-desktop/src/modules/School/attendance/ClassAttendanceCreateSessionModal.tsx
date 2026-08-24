"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/theme";
import type { AttendanceSessionRecord, AttendanceSessionTracking } from "@/modules/School/attendance/types";

export function ClassAttendanceCreateSessionModal({
  open,
  onClose,
  onSubmit,
  pending,
  sessions,
}: Readonly<{
  open: boolean;
  onClose: () => void;
  onSubmit: (input: {
    classSessionId: string;
    hidden: boolean;
    trackingMode: AttendanceSessionTracking;
  }) => void;
  pending?: boolean;
  sessions: readonly AttendanceSessionRecord[];
}>) {
  const [classSessionId, setClassSessionId] = useState("");
  const [hidden, setHidden] = useState(false);
  const [trackingMode, setTrackingMode] = useState<AttendanceSessionTracking>("manual");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setClassSessionId(sessions[0]?.id ?? "");
    setHidden(false);
    setTrackingMode("manual");
    setError(null);
  }, [open, sessions]);

  if (!open) return null;

  const handleSubmit = () => {
    if (!classSessionId.trim()) {
      setError("Select a class session.");
      return;
    }
    onSubmit({ classSessionId, hidden, trackingMode });
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-labelledby="attendance-session-modal-title">
      <div className="w-full max-w-md rounded-xl border border-border-default bg-surface-default p-5 shadow-xl">
        <h2 id="attendance-session-modal-title" className="text-lg font-semibold text-text-primary">
          Session attendance settings
        </h2>
        <p className="mt-1 text-xs text-text-tertiary">
          Columns come from sessions on the Class tab. Configure tracking mode and parent visibility here.
        </p>
        <div className="mt-4 space-y-3">
          <label className="block text-xs font-medium text-text-secondary">
            Class session
            <select
              value={classSessionId}
              onChange={(e) => setClassSessionId(e.target.value)}
              className="mt-1 w-full rounded-md border border-border-default bg-surface-default px-3 py-2 text-sm"
            >
              {sessions.map((session) => (
                <option key={session.id} value={session.id}>
                  {session.title}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs font-medium text-text-secondary">
            Tracking
            <select
              value={trackingMode}
              onChange={(e) => setTrackingMode(e.target.value as AttendanceSessionTracking)}
              className="mt-1 w-full rounded-md border border-border-default bg-surface-default px-3 py-2 text-sm"
            >
              <option value="manual">Manual — checkbox column</option>
              <option value="device">Device — auto track (fingerprint / QR)</option>
            </select>
          </label>
          <label className="flex items-center gap-2 text-xs font-medium text-text-secondary">
            <input
              type="checkbox"
              checked={hidden}
              onChange={(e) => setHidden(e.target.checked)}
              className="size-3.5 rounded border-border-default"
            />
            Hidden from parents (eye-off column header)
          </label>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <Button type="button" variant="secondary" size="sm" onClick={onClose} disabled={pending}>
            Cancel
          </Button>
          <Button type="button" variant="primary" size="sm" onClick={handleSubmit} disabled={pending}>
            Save settings
          </Button>
        </div>
      </div>
    </div>
  );
}
