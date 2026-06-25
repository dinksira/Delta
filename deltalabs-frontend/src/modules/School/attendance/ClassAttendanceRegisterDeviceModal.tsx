"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/theme";
import type { AttendanceDeviceType } from "@/modules/School/attendance/types";

export function ClassAttendanceRegisterDeviceModal({
  open,
  onClose,
  onSubmit,
  pending,
  defaultSessionLabel,
  sessionOptions = [],
}: Readonly<{
  open: boolean;
  onClose: () => void;
  onSubmit: (input: {
    name: string;
    deviceType: AttendanceDeviceType;
    attendanceSessionLabel: string;
  }) => void;
  pending?: boolean;
  defaultSessionLabel?: string;
  sessionOptions?: readonly { id: string; title: string }[];
}>) {
  const [name, setName] = useState("");
  const [deviceType, setDeviceType] = useState<AttendanceDeviceType>("fingerprint");
  const [sessionLabel, setSessionLabel] = useState("Class Attendance");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setName("");
    setDeviceType("fingerprint");
    setSessionLabel(defaultSessionLabel?.trim() || sessionOptions[0]?.title || "Class Attendance");
    setError(null);
  }, [defaultSessionLabel, open, sessionOptions]);

  if (!open) return null;

  const handleSubmit = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Device name is required.");
      return;
    }
    onSubmit({
      name: trimmed,
      deviceType,
      attendanceSessionLabel: sessionLabel.trim() || "Class Attendance",
    });
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true" aria-labelledby="attendance-device-modal-title">
      <div className="w-full max-w-md rounded-xl border border-border-default bg-surface-default p-5 shadow-xl">
        <h2 id="attendance-device-modal-title" className="text-lg font-semibold text-text-primary">
          Register device
        </h2>
        <p className="mt-1 text-xs text-text-tertiary">Connect fingerprint or QR hardware for auto attendance tracking.</p>
        <div className="mt-4 space-y-3">
          <label className="block text-xs font-medium text-text-secondary">
            Device name
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-md border border-border-default bg-surface-default px-3 py-2 text-sm"
              placeholder="e.g. Fingerprint — Class A"
            />
          </label>
          <label className="block text-xs font-medium text-text-secondary">
            Device type
            <select
              value={deviceType}
              onChange={(e) => setDeviceType(e.target.value as AttendanceDeviceType)}
              className="mt-1 w-full rounded-md border border-border-default bg-surface-default px-3 py-2 text-sm"
            >
              <option value="fingerprint">Fingerprint</option>
              <option value="qr_scanner">QR Scanner</option>
              <option value="other">Other</option>
            </select>
          </label>
          <label className="block text-xs font-medium text-text-secondary">
            Class session
            {sessionOptions.length > 0 ? (
              <select
                value={sessionLabel}
                onChange={(e) => setSessionLabel(e.target.value)}
                className="mt-1 w-full rounded-md border border-border-default bg-surface-default px-3 py-2 text-sm"
              >
                {sessionOptions.map((session) => (
                  <option key={session.id} value={session.title}>
                    {session.title}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={sessionLabel}
                onChange={(e) => setSessionLabel(e.target.value)}
                className="mt-1 w-full rounded-md border border-border-default bg-surface-default px-3 py-2 text-sm"
              />
            )}
          </label>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <Button type="button" variant="secondary" size="sm" onClick={onClose} disabled={pending}>
            Cancel
          </Button>
          <Button type="button" variant="primary" size="sm" onClick={handleSubmit} disabled={pending}>
            Register device
          </Button>
        </div>
      </div>
    </div>
  );
}
