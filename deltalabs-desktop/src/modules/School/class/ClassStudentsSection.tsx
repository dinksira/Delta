"use client";

import { UserMinus, UserPlus } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/theme";
import type { ClassEnrollmentDto } from "@/modules/School/api";
import { ClassSessionSection } from "@/modules/School/class/ClassSessionSection";

function displayStudentName(row: ClassEnrollmentDto): string {
  return row.user.fullName?.trim() || row.user.username?.trim() || row.user.email?.trim() || "Student";
}

function displayStudentSecondary(row: ClassEnrollmentDto): string | null {
  const email = row.user.email?.trim();
  const name = row.user.fullName?.trim();
  if (email && name) return email;
  if (email) return null;
  return row.user.username?.trim() || null;
}

export function ClassStudentsSection({
  enrollments,
  loading,
  canMutate,
  enrolling,
  withdrawingId,
  onEnroll,
  onWithdraw,
}: Readonly<{
  enrollments: readonly ClassEnrollmentDto[];
  loading: boolean;
  canMutate: boolean;
  enrolling: boolean;
  withdrawingId: string | null;
  onEnroll: (email: string) => Promise<void>;
  onWithdraw: (enrollmentId: string) => void;
}>) {
  const [email, setEmail] = useState("");
  const [formOpen, setFormOpen] = useState(false);

  const openForm = () => {
    if (!canMutate) return;
    setEmail("");
    setFormOpen(true);
  };

  const submitEnroll = async () => {
    const trimmed = email.trim();
    if (!trimmed) return;
    await onEnroll(trimmed);
    setFormOpen(false);
    setEmail("");
  };

  return (
    <ClassSessionSection
      title="Students"
      actions={
        <Button
          type="button"
          variant="primary"
          size="sm"
          className="h-9 gap-1.5 px-4 text-[13px] font-semibold sm:px-5"
          onClick={openForm}
          disabled={!canMutate || loading}
          title={!canMutate ? "Requires school:manage on the organization." : undefined}
        >
          <UserPlus className="size-4" aria-hidden />
          Add student
        </Button>
      }
    >
      {formOpen ? (
        <div className="rounded-xl border border-border-default bg-surface-muted/20 p-4">
          <p className="text-sm font-semibold text-text-primary">Enroll student by email</p>
          <p className="mt-1 text-xs text-text-tertiary">
            The student must already have a Deltalabs account. They will be added to this school as a student if needed.
          </p>
          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
            <label className="flex min-w-0 flex-1 flex-col gap-1.5">
              <span className="text-xs font-medium text-text-secondary">Email</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student@example.com"
                className="h-10 rounded-lg border border-border-default bg-surface px-3 text-sm text-text-primary outline-none ring-primary-500/40 focus:ring-2"
                disabled={enrolling}
              />
            </label>
            <div className="flex shrink-0 gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setFormOpen(false)}
                disabled={enrolling}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={submitEnroll}
                disabled={enrolling || !email.trim()}
              >
                {enrolling ? "Enrolling…" : "Enroll"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={`sk-${i}`}
              className="h-16 animate-pulse rounded-xl border border-border-default bg-surface-muted/40"
            />
          ))}
        </div>
      ) : enrollments.length === 0 ? (
        <div
          className="flex min-h-[14rem] flex-col items-center justify-center rounded-xl border border-dashed border-border-default bg-surface-muted/20 px-6 py-12 text-center"
          role="status"
        >
          <p className="text-sm font-semibold text-text-primary">No students enrolled</p>
          <p className="mt-2 max-w-sm text-xs leading-relaxed text-text-tertiary">
            Add students to this class using their account email.
          </p>
          {canMutate ? (
            <Button type="button" variant="primary" size="sm" className="mt-4" onClick={openForm}>
              Add student
            </Button>
          ) : null}
        </div>
      ) : (
        <ul className="space-y-3">
          {enrollments.map((row) => {
            const secondary = displayStudentSecondary(row);
            const withdrawing = withdrawingId === row.id;
            return (
              <li
                key={row.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-border-default bg-surface px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-text-primary">{displayStudentName(row)}</p>
                  {secondary ? <p className="truncate text-xs text-text-tertiary">{secondary}</p> : null}
                </div>
                {canMutate ? (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="shrink-0 gap-1.5 text-text-secondary hover:text-red-600"
                    onClick={() => onWithdraw(row.id)}
                    disabled={withdrawing || Boolean(withdrawingId)}
                    title="Remove from class"
                  >
                    <UserMinus className="size-4" aria-hidden />
                    {withdrawing ? "Removing…" : "Remove"}
                  </Button>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </ClassSessionSection>
  );
}
