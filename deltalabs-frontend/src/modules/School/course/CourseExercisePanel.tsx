"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Clock, Ghost, HelpCircle, X } from "lucide-react";
import { useMemo, useState } from "react";
import { createPortal } from "react-dom";

import { Button, DialogOverlay } from "@/components/theme";
import { ApiError } from "@/lib/apiClient";
import {
  createCourseExercise,
  fetchCourseExercises,
  type CourseExerciseDto,
  type SchoolWorkspaceItemDto,
} from "@/modules/School/api";
import { GhostDrawer } from "@/modules/School/ghost";
import { CourseExerciseManagementTableView } from "@/modules/School/course/CourseExerciseManagementTableView";
import { schoolQueryKeys } from "@/modules/School/hooks/schoolQueryKeys";

type ViewMode = "direct" | "table";
type KindTab = "exercise" | "test";

const DEFAULT_COVER =
  "https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?auto=format&fit=crop&w=800&q=80";

export function CourseExercisePanel({
  orgId,
  schoolId,
  courseItem,
  canMutate,
}: Readonly<{
  orgId: string;
  schoolId: string;
  courseItem: SchoolWorkspaceItemDto;
  canMutate: boolean;
}>) {
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useState<ViewMode>("direct");
  const [kind, setKind] = useState<KindTab>("exercise");
  const [createOpen, setCreateOpen] = useState(false);
  const [ghostOpen, setGhostOpen] = useState(false);
  const [ghostId, setGhostId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const listQuery = useQuery({
    queryKey: schoolQueryKeys.courseExercises(orgId, schoolId, courseItem.id, kind),
    queryFn: () => fetchCourseExercises(orgId, schoolId, courseItem.id, kind),
    enabled: viewMode === "direct",
    staleTime: 0,
    refetchOnMount: "always",
  });

  const createMutation = useMutation({
    mutationFn: (payload: {
      title: string;
      timeTaken: string;
      totalQuestions: number;
    }) =>
      createCourseExercise(orgId, schoolId, courseItem.id, {
        title: payload.title,
        timeTaken: payload.timeTaken,
        totalQuestions: payload.totalQuestions,
        kind,
        coverImageUrl: DEFAULT_COVER,
        orgLabel: "",
      }),
    onSuccess: async () => {
      setCreateOpen(false);
      setError(null);
      await queryClient.invalidateQueries({
        queryKey: ["school", "course-exercises", orgId, schoolId, courseItem.id],
      });
      await queryClient.refetchQueries({
        queryKey: schoolQueryKeys.courseExercises(orgId, schoolId, courseItem.id, kind),
      });
    },
    onError: (err) => {
      setError(err instanceof ApiError ? err.message : "Could not create exercise.");
    },
  });

  const items = useMemo(() => listQuery.data?.items ?? [], [listQuery.data?.items]);
  const defineLabel = kind === "exercise" ? "Define Exercise" : "Define Test";
  const [opsInstanceId, setOpsInstanceId] = useState<string | null>(null);
  const [openGhostOpsBoard, setOpenGhostOpsBoard] = useState(false);

  const ghostDrawer = (
    <GhostDrawer
      open={ghostOpen}
      canMutate={canMutate}
      ghostId={ghostId}
      host={{
        orgId,
        schoolId,
        hostType: "course",
        hostWorkspaceItemId: courseItem.id,
        slotKey: kind === "exercise" ? "exercise.resource" : "test.resource",
        resourceKind: "document",
        defaultNodeName: kind === "exercise" ? "Exercise resource" : "Test resource",
      }}
      onClose={() => setGhostOpen(false)}
      onGhostCreated={(g) => setGhostId(g.id)}
      onOpenOpsTable={(boot) => {
        setOpsInstanceId(boot.instanceId);
        setOpenGhostOpsBoard(true);
        setViewMode("table");
        void queryClient.invalidateQueries({
          queryKey: schoolQueryKeys.workspaceItem(orgId, schoolId, courseItem.id),
        });
      }}
    />
  );

  if (viewMode === "table") {
    return (
      <div className="space-y-5" aria-label="Exercise management table">
        <ViewToggle
          viewMode={viewMode}
          setViewMode={(m) => {
            if (m === "direct") setOpenGhostOpsBoard(false);
            if (m === "table") setOpenGhostOpsBoard(false);
            setViewMode(m);
          }}
        />
        <CourseExerciseManagementTableView
          orgId={orgId}
          schoolId={schoolId}
          courseItem={courseItem}
          canMutate={canMutate}
          preferredGhostOpsInstanceId={opsInstanceId}
          onGhostOpsBootstrapped={(id) => setOpsInstanceId(id)}
          openGhostOpsBoard={openGhostOpsBoard}
          onDismissOpenGhostOps={() => setOpenGhostOpsBoard(false)}
        />
        {ghostDrawer}
      </div>
    );
  }

  return (
    <div className="space-y-5" aria-label="Course Exercise & Test">
      <ViewToggle viewMode={viewMode} setViewMode={setViewMode} />

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex items-end gap-5">
          {(
            [
              ["exercise", "Exercise"],
              ["test", "Test"],
            ] as const
          ).map(([id, label]) => {
            const active = kind === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setKind(id)}
                className={[
                  "relative pb-2.5 text-sm transition-colors",
                  active
                    ? "font-bold text-[#0f2a3d]"
                    : "font-medium text-[#8a9aab] hover:text-text-primary",
                ].join(" ")}
              >
                {label}
                {active ? (
                  <span className="absolute inset-x-0 bottom-0 h-[3px] rounded-full bg-[#0f2a3d]" />
                ) : null}
              </button>
            );
          })}
        </div>
        <Button
          type="button"
          variant="primary"
          size="md"
          disabled={!canMutate}
          onClick={() => {
            setError(null);
            setCreateOpen(true);
          }}
        >
          {defineLabel}
        </Button>
      </div>

      {listQuery.isPending ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="h-48 animate-pulse rounded-2xl bg-surface-muted/50" />
          <div className="h-48 animate-pulse rounded-2xl bg-surface-muted/50" />
        </div>
      ) : listQuery.isError ? (
        <p className="text-sm text-red-600">
          {listQuery.error instanceof ApiError
            ? listQuery.error.message
            : "Could not load exercises."}
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <button
            type="button"
            disabled={!canMutate}
            onClick={() => {
              setError(null);
              setGhostId(null);
              setGhostOpen(true);
            }}
            className="flex min-h-[13.5rem] flex-col items-center justify-center rounded-2xl bg-[#e8eef2] px-6 py-10 text-center transition-colors hover:bg-[#dfe7ed] disabled:opacity-60"
          >
            <p className="text-sm font-medium text-[#5a6b7a]">Open ghost workspace</p>
            <Ghost className="mt-4 size-10 text-primary-800" strokeWidth={1.4} aria-hidden />
          </button>

          {items.map((ex) => (
            <ExerciseCard key={ex.id} exercise={ex} />
          ))}
        </div>
      )}

      {createOpen ? (
        <CreateExerciseModal
          kind={kind}
          busy={createMutation.isPending}
          error={error}
          onClose={() => !createMutation.isPending && setCreateOpen(false)}
          onSave={(payload) => createMutation.mutate(payload)}
        />
      ) : null}

      {ghostDrawer}
    </div>
  );
}

function ExerciseCard({ exercise }: Readonly<{ exercise: CourseExerciseDto }>) {
  const creatorName =
    exercise.createdBy.fullName?.trim() || exercise.createdBy.username || "Someone";
  const initials = creatorName.slice(0, 2).toUpperCase();

  return (
    <article className="overflow-hidden rounded-2xl border border-border-default bg-white shadow-[0_1px_3px_rgba(15,40,60,0.06)]">
      <div className="flex min-h-[13.5rem] flex-col sm:flex-row">
        <div className="relative h-36 w-full shrink-0 bg-surface-muted sm:h-auto sm:w-[42%]">
          {exercise.coverImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={exercise.coverImageUrl}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-text-tertiary">
              <HelpCircle className="size-10" aria-hidden />
            </div>
          )}
        </div>
        <div className="flex min-w-0 flex-1 flex-col justify-between p-4">
          <div>
            <h3 className="text-base font-bold text-[#0f2a3d]">
              {exercise.title}
              {exercise.orgLabel ? (
                <>
                  <span className="mx-2 text-border-default" aria-hidden>
                    |
                  </span>
                  <span className="font-medium text-[#5a6b7a]">{exercise.orgLabel}</span>
                </>
              ) : null}
            </h3>
            <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-[#5a6b7a]">
              <span className="inline-flex items-center gap-1.5">
                <HelpCircle className="size-3.5" aria-hidden />
                {exercise.totalQuestions} total questions
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Clock className="size-3.5" aria-hidden />
                {exercise.timeTaken || "—"} long
              </span>
            </div>
            <Button type="button" variant="primary" size="sm" className="mt-4">
              Go to Exercise
            </Button>
          </div>
          <div className="mt-4 flex items-center justify-end gap-2">
            <span className="text-[11px] text-[#8a9aab]">Created by</span>
            <span
              className="inline-flex size-7 items-center justify-center overflow-hidden rounded-full bg-surface-muted text-[10px] font-semibold text-text-secondary ring-2 ring-white"
              title={creatorName}
            >
              {exercise.createdBy.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={exercise.createdBy.avatarUrl}
                  alt=""
                  className="size-full object-cover"
                />
              ) : (
                initials
              )}
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}

function CreateExerciseModal({
  kind,
  busy,
  error,
  onClose,
  onSave,
}: Readonly<{
  kind: KindTab;
  busy: boolean;
  error: string | null;
  onClose: () => void;
  onSave: (payload: { title: string; timeTaken: string; totalQuestions: number }) => void;
}>) {
  const [title, setTitle] = useState("");
  const [timeTaken, setTimeTaken] = useState("");
  const [totalQuestions, setTotalQuestions] = useState("");

  const fieldClass =
    "w-full rounded-xl border border-border-default bg-surface-default px-4 py-3 text-sm outline-none placeholder:text-text-tertiary focus:border-primary-500";

  return createPortal(
    <>
      <DialogOverlay onClose={() => (busy ? null : onClose())} />
      <div className="fixed inset-0 z-[1320] flex items-center justify-center p-4">
        <div
          role="dialog"
          aria-modal="true"
          aria-label={kind === "exercise" ? "Create exercise" : "Create test"}
          className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-5 pt-5">
            <h3 className="text-lg font-semibold lowercase text-text-primary">
              create {kind}
            </h3>
            <button
              type="button"
              disabled={busy}
              onClick={onClose}
              className="rounded-md p-1 text-text-tertiary hover:bg-surface-muted"
              aria-label="Close"
            >
              <X className="size-5" aria-hidden />
            </button>
          </div>

          <div className="space-y-4 px-5 pb-5 pt-3">
            <div className="overflow-hidden rounded-xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={DEFAULT_COVER}
                alt=""
                className="h-36 w-full object-cover"
              />
            </div>

            <input
              value={title}
              disabled={busy}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={kind === "exercise" ? "Exercise" : "Test"}
              className={fieldClass}
            />
            <input
              value={timeTaken}
              disabled={busy}
              onChange={(e) => setTimeTaken(e.target.value)}
              placeholder="Time taken"
              className={fieldClass}
            />
            <input
              value={totalQuestions}
              disabled={busy}
              onChange={(e) => setTotalQuestions(e.target.value.replace(/[^\d]/g, ""))}
              placeholder="Total question"
              inputMode="numeric"
              className={fieldClass}
            />

            {error ? <p className="text-sm text-red-600">{error}</p> : null}

            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="secondary" size="sm" disabled={busy} onClick={onClose}>
                Cancel
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                disabled={busy || !title.trim()}
                onClick={() =>
                  onSave({
                    title: title.trim(),
                    timeTaken: timeTaken.trim() || "1 hr",
                    totalQuestions: Number(totalQuestions) || 0,
                  })
                }
              >
                {busy ? "Saving…" : "Save"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>,
    document.body,
  );
}

function ViewToggle({
  viewMode,
  setViewMode,
}: Readonly<{
  viewMode: ViewMode;
  setViewMode: (m: ViewMode) => void;
}>) {
  return (
    <div className="flex flex-wrap items-center gap-0">
      <button
        type="button"
        onClick={() => setViewMode("direct")}
        className={[
          "rounded-lg px-4 py-2 text-sm font-semibold transition-colors",
          viewMode === "direct"
            ? "bg-surface-muted text-primary-800"
            : "text-text-secondary hover:bg-surface-muted/60",
        ].join(" ")}
      >
        Direct View
      </button>
      <span className="mx-1.5 h-5 w-px bg-border-default" aria-hidden />
      <button
        type="button"
        onClick={() => setViewMode("table")}
        className={[
          "rounded-lg px-4 py-2 text-sm font-semibold transition-colors",
          viewMode === "table"
            ? "bg-surface-muted text-primary-800"
            : "text-text-secondary hover:bg-surface-muted/60",
        ].join(" ")}
      >
        Management Table
      </button>
    </div>
  );
}
