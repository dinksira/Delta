"use client";

import { MoreHorizontal, Plus } from "lucide-react";

import { deviceStatusClass, deviceTypeLabel, formatAttendanceDate } from "@/modules/School/attendance/attendanceFormat";
import type { AttendanceDeviceRecord } from "@/modules/School/attendance/types";
import { Button } from "@/components/theme";

/**
 * Device integration table (Figma):
 * Select | Device Name | Device Type | Attendance Session | Status | Last Synced | Actions
 */
export function ClassAttendanceDevicesTable({
  devices,
  canMutate,
  onRegister,
}: Readonly<{
  devices: readonly AttendanceDeviceRecord[];
  canMutate: boolean;
  onRegister: () => void;
}>) {
  return (
    <section className="space-y-4" aria-labelledby="class-attendance-devices-title">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border-default bg-surface-muted/40 px-4 py-3.5 sm:px-5 sm:py-4">
        <h2 id="class-attendance-devices-title" className="text-base font-bold text-text-primary sm:text-[1.05rem]">
          Device&apos;s
        </h2>
        <Button type="button" variant="primary" size="sm" className="gap-1.5 px-4" onClick={onRegister} disabled={!canMutate}>
          <Plus className="size-4" aria-hidden />
          Register Device
        </Button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border-default bg-surface-default shadow-sm">
        <table className="min-w-full border-separate border-spacing-0 text-sm">
          <thead>
            <tr className="bg-[#e8edf3] text-left text-xs font-medium text-text-secondary">
              <th className="w-9 border-b border-r border-white px-1.5 py-2.5">
                <span className="sr-only">Select</span>
              </th>
              <th className="min-w-[180px] border-b border-l border-white px-3 py-2.5">Device Name</th>
              <th className="min-w-[120px] border-b border-l border-white px-3 py-2.5">Device Type</th>
              <th className="min-w-[160px] border-b border-l border-white px-3 py-2.5">Attendance Session</th>
              <th className="min-w-[100px] border-b border-l border-white px-3 py-2.5">Status</th>
              <th className="min-w-[160px] border-b border-l border-white px-3 py-2.5">Last Synced</th>
              <th className="w-10 border-b border-l border-white px-1.5 py-2.5">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {devices.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-3 py-10 text-center text-sm text-text-tertiary">
                  No devices registered. Use Register Device to connect fingerprint or QR hardware.
                </td>
              </tr>
            ) : (
              devices.map((device) => (
                <tr key={device.id} className="hover:bg-surface-muted/40">
                  <td className="border-b border-r border-border-default px-1.5 py-2.5 align-middle">
                    <input type="checkbox" className="size-3.5 rounded border-border-default" disabled aria-label="Select device" />
                  </td>
                  <td className="border-b border-l border-border-default px-3 py-2.5 align-middle font-medium text-text-primary">
                    {device.name}
                  </td>
                  <td className="border-b border-l border-border-default px-3 py-2.5 align-middle text-text-secondary">
                    {deviceTypeLabel(device.deviceType)}
                  </td>
                  <td className="border-b border-l border-border-default px-3 py-2.5 align-middle text-text-secondary">
                    {device.attendanceSessionLabel}
                  </td>
                  <td className="border-b border-l border-border-default px-3 py-2.5 align-middle">
                    <span
                      className={[
                        "inline-flex min-w-[4.5rem] justify-center rounded px-2.5 py-1 text-xs font-semibold",
                        deviceStatusClass(device.status),
                      ].join(" ")}
                    >
                      {device.status === "online" ? "Online" : "Offline"}
                    </span>
                  </td>
                  <td className="border-b border-l border-border-default px-3 py-2.5 align-middle text-text-secondary">
                    {formatAttendanceDate(device.lastSyncedAt)}
                  </td>
                  <td className="border-b border-l border-border-default px-1.5 py-2.5 text-center align-middle">
                    <button type="button" className="rounded p-1 text-text-tertiary hover:bg-surface-muted" aria-label="Device actions">
                      <MoreHorizontal className="size-4" aria-hidden />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
