"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";

import { Button } from "@/components/theme";
import { ApiError } from "@/lib/apiClient";
import type { ManagementTableColumnDto } from "@/modules/School/api";
import { submitClassLeaveRequest } from "@/modules/School/api";
import { CLASS_WORKSPACE_LAYOUT } from "@/modules/School/class/layoutConstants";
import { schoolQueryKeys } from "@/modules/School/hooks/schoolQueryKeys";

function isStudentFillableColumn(col: ManagementTableColumnDto): boolean {
  const title = col.title.trim().toLowerCase();
  return title !== "student" && title !== "status";
}

function LeaveRequestField({
  column,
  value,
  onChange,
}: Readonly<{
  column: ManagementTableColumnDto;
  value: unknown;
  onChange: (next: unknown) => void;
}>) {
  const label = column.title;
  const t = column.type;

  if (t === "textarea") {
    return (
      <label className="block text-sm">
        <span className="font-medium text-text-secondary">{label}</span>
        <textarea
          className="mt-1 w-full rounded-md border border-border-default bg-surface-default px-3 py-2 text-sm"
          rows={3}
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value)}
        />
      </label>
    );
  }

  if (t === "date") {
    return (
      <label className="block text-sm">
        <span className="font-medium text-text-secondary">{label}</span>
        <input
          type="date"
          className="mt-1 w-full rounded-md border border-border-default bg-surface-default px-3 py-2 text-sm"
          value={typeof value === "string" ? value.slice(0, 10) : ""}
          onChange={(e) => onChange(e.target.value)}
        />
      </label>
    );
  }

  if (t === "link") {
    return (
      <label className="block text-sm">
        <span className="font-medium text-text-secondary">{label}</span>
        <input
          type="url"
          placeholder="https://"
          className="mt-1 w-full rounded-md border border-border-default bg-surface-default px-3 py-2 text-sm"
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value)}
        />
      </label>
    );
  }

  return (
    <label className="block text-sm">
      <span className="font-medium text-text-secondary">{label}</span>
      <input
        type="text"
        className="mt-1 w-full rounded-md border border-border-default bg-surface-default px-3 py-2 text-sm"
        value={typeof value === "string" || typeof value === "number" ? String(value) : ""}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}

export function ClassLeaveRequestSubmitForm({
  orgId,
  schoolId,
  classItemId,
  instanceId,
  columns,
}: Readonly<{
  orgId: string;
  schoolId: string;
  classItemId: string;
  instanceId: string;
  columns: readonly ManagementTableColumnDto[];
}>) {
  const queryClient = useQueryClient();
  const fillableColumns = useMemo(() => columns.filter(isStudentFillableColumn), [columns]);
  const [cells, setCells] = useState<Record<string, unknown>>({});
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitMutation = useMutation({
    mutationFn: () => submitClassLeaveRequest(orgId, schoolId, classItemId, { cells }),
    onSuccess: async () => {
      setSubmitted(true);
      setError(null);
      await queryClient.invalidateQueries({
        queryKey: ["school", "management-tables", "rows", orgId, schoolId, instanceId],
      });
    },
    onError: (e) => {
      if (e instanceof ApiError) setError(e.message);
      else setError("Could not submit leave request.");
    },
  });

  if (submitted) {
    return (
      <div
        className="flex min-h-[14rem] flex-col items-center justify-center rounded-xl border border-border-default bg-surface-muted/20 px-6 py-12 text-center"
        role="status"
      >
        <p className="text-sm font-semibold text-text-primary">Leave request submitted</p>
        <p className="mt-2 max-w-sm text-xs leading-relaxed text-text-tertiary">
          Your request was sent to the class manager. You will see updates when they review it.
        </p>
        <Button type="button" variant="secondary" size="sm" className="mt-4" onClick={() => setSubmitted(false)}>
          Submit another
        </Button>
      </div>
    );
  }

  return (
    <section className="space-y-4" aria-labelledby="class-leave-submit-title">
      <div className={CLASS_WORKSPACE_LAYOUT.sectionBar}>
        <h2 id="class-leave-submit-title" className={CLASS_WORKSPACE_LAYOUT.sectionTitle}>
          Submit leave request
        </h2>
      </div>
      <p className="text-xs leading-relaxed text-text-tertiary">
        Fill in the form below. Your submission creates a row in the class leave inbox — managers cannot add rows for you.
      </p>
      <form
        className="max-w-lg space-y-4 rounded-xl border border-border-default bg-surface-default p-4"
        onSubmit={(e) => {
          e.preventDefault();
          setError(null);
          submitMutation.mutate();
        }}
      >
        {fillableColumns.map((col) => (
          <LeaveRequestField
            key={col.id}
            column={col}
            value={cells[col.id]}
            onChange={(next) => setCells((prev) => ({ ...prev, [col.id]: next }))}
          />
        ))}
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <Button type="submit" variant="primary" size="sm" disabled={submitMutation.isPending}>
          {submitMutation.isPending ? "Submitting…" : "Submit leave request"}
        </Button>
      </form>
    </section>
  );
}
