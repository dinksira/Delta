"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Clock, Ghost, HelpCircle } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/theme";
import { ApiError } from "@/lib/apiClient";
import {
  createCourseExercise,
  fetchCourseExercises,
  type CourseExerciseDto,
  type SchoolWorkspaceItemDto,
} from "@/modules/School/api";
import { CourseExerciseManagementTableView } from "@/modules/School/course/CourseExerciseManagementTableView";
import { CreateExerciseModal } from "@/modules/School/course/exercise/CreateExerciseModal";
import { GhostDrawer } from "@/modules/School/ghost";
import { schoolQueryKeys } from "@/modules/School/hooks/schoolQueryKeys";

type ViewMode = "direct" | "table";
type KindTab = "exercise" | "test";

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
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useState<ViewMode>("direct");
  const [kind, setKind] = useState<KindTab>(() =>
    searchParams.get("tab") === "test" ? "test" : "exercise",
  );
  const [createOpen, setCreateOpen] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [ghostOpen, setGhostOpen] = useState(false);
  const [ghostId, setGhostId] = useState<string | null>(null);
  const [opsInstanceId, setOpsInstanceId] = useState<string | null>(null);
  const [openGhostOpsBoard, setOpenGhostOpsBoard] = useState(false);

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "test" || tab === "exercise") setKind(tab);
  }, [searchParams]);

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
      coverImageUrl: string;
    }) => {
      const minutes = /^\d+$/.test(payload.timeTaken.trim())
        ? Number(payload.timeTaken.trim())
        : undefined;
      return createCourseExercise(orgId, schoolId, courseItem.id, {
        title: payload.title,
        timeTaken: payload.timeTaken,
        ...(minutes !== undefined ? { timeMinutes: minutes } : {}),
        totalQuestions: payload.totalQuestions,
        kind,
        status: "draft",
        coverImageUrl: payload.coverImageUrl.trim(),
        orgLabel: "",
      });
    },
    onSuccess: async (ex) => {
      setCreateOpen(false);
      setCreateError(null);
      await queryClient.invalidateQueries({
        queryKey: ["school", "course-exercises", orgId, schoolId, courseItem.id],
      });
      router.push(
        `/features/school/${encodeURIComponent(schoolId)}/course/${encodeURIComponent(courseItem.id)}/exercises/${encodeURIComponent(ex.id)}/edit`,
      );
    },
    onError: (err) => {
      setCreateError(
        err instanceof ApiError
          ? err.message
          : `Could not create ${kind === "test" ? "test" : "exercise"}.`,
      );
    },
  });

  const items = useMemo(() => listQuery.data?.items ?? [], [listQuery.data?.items]);
  const defineLabel = kind === "exercise" ? "Define Exercise" : "Define Test";
  const ghostTileLabel =
    kind === "exercise" ? "Open ghost workspace" : "You can create ghost resource here";

  const openCreateModal = () => {
    setCreateError(null);
    setCreateOpen(true);
  };

  const setKindTab = (next: KindTab) => {
    setKind(next);
    const params = new URLSearchParams(searchParams.toString());
    params.set("nav", "exercise");
    if (next === "test") params.set("tab", "test");
    else params.delete("tab");
    router.replace(`?${params.toString()}`, { scroll: false });
  };

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
        resourceKind: kind === "exercise" ? "exercise" : "test",
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
                onClick={() => setKindTab(id)}
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
          onClick={openCreateModal}
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
            : `Could not load ${kind === "test" ? "tests" : "exercises"}.`}
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <button
            type="button"
            disabled={!canMutate}
            onClick={() => {
              setGhostId(null);
              setGhostOpen(true);
            }}
            className="flex min-h-[13.5rem] flex-col items-center justify-center rounded-2xl bg-[#e8eef2] px-6 py-10 text-center transition-colors hover:bg-[#dfe7ed] disabled:opacity-60"
          >
            <p className="text-sm font-medium text-[#5a6b7a]">{ghostTileLabel}</p>
            <Ghost className="mt-4 size-10 text-primary-800" strokeWidth={1.4} aria-hidden />
          </button>

          {items.map((ex) => (
            <ExerciseCard
              key={ex.id}
              exercise={ex}
              productKind={kind}
              href={`/features/school/${encodeURIComponent(schoolId)}/course/${encodeURIComponent(courseItem.id)}/exercises/${encodeURIComponent(ex.id)}/edit`}
              onOpenGhost={
                ex.ghostId
                  ? () => {
                      setGhostId(ex.ghostId!);
                      setGhostOpen(true);
                    }
                  : undefined
              }
            />
          ))}
        </div>
      )}

      <CreateExerciseModal
        open={createOpen}
        orgId={orgId}
        kind={kind}
        busy={createMutation.isPending}
        error={createError}
        onClose={() => !createMutation.isPending && setCreateOpen(false)}
        onSave={(payload) => createMutation.mutate(payload)}
      />

      {ghostDrawer}
    </div>
  );
}

function ExerciseCard({
  exercise,
  productKind,
  href,
  onOpenGhost,
}: Readonly<{
  exercise: CourseExerciseDto;
  productKind: KindTab;
  href: string;
  onOpenGhost?: () => void;
}>) {
  const creatorName =
    exercise.createdBy.fullName?.trim() || exercise.createdBy.username || "Someone";
  const initials = creatorName.slice(0, 2).toUpperCase();
  const status = exercise.status ?? "published";
  const isGhostWork =
    Boolean(exercise.ghostId?.trim()) && (exercise.status ?? "published") !== "published";
  const coverSrc =
    exercise.coverImageUrl?.trim() &&
    !exercise.coverImageUrl.includes("photo-1636466497217-26a8cbeaf0aa") &&
    !exercise.coverImageUrl.startsWith("media://")
      ? exercise.coverImageUrl.trim()
      : "";
  const openLabel = (() => {
    if (isGhostWork || status === "draft") return "Continue editing";
    return productKind === "test" ? "Go to Test" : "Open exercise";
  })();

  return (
    <article
      className={[
        "overflow-hidden rounded-2xl border bg-white shadow-[0_1px_3px_rgba(15,40,60,0.06)]",
        isGhostWork ? "border-[#b7c9d6] ring-1 ring-[#d7e3eb]" : "border-border-default",
      ].join(" ")}
    >
      <div className="flex min-h-[13.5rem] flex-col sm:flex-row">
        <div
          className={[
            "relative h-36 w-full shrink-0 sm:h-auto sm:w-[42%]",
            isGhostWork ? "bg-[#e8eef2]" : "bg-surface-muted",
          ].join(" ")}
        >
          {coverSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={coverSrc} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-text-tertiary">
              {isGhostWork ? (
                <Ghost className="size-10 text-primary-800" strokeWidth={1.4} aria-hidden />
              ) : (
                <HelpCircle className="size-10" aria-hidden />
              )}
              {isGhostWork ? (
                <span className="text-[11px] font-medium text-[#5a6b7a]">Ghost work</span>
              ) : null}
            </div>
          )}
          {isGhostWork && coverSrc ? (
            <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-md bg-[#0f2a3d]/80 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
              <Ghost className="size-3" strokeWidth={2} aria-hidden />
              Ghost
            </span>
          ) : null}
        </div>
        <div className="flex min-w-0 flex-1 flex-col justify-between p-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-bold text-[#0f2a3d]">{exercise.title}</h3>
              {isGhostWork ? (
                <span className="inline-flex items-center gap-1 rounded-md bg-[#dfe7ed] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary-800">
                  <Ghost className="size-3" strokeWidth={2} aria-hidden />
                  Ghost
                </span>
              ) : null}
              {status === "draft" && !isGhostWork ? (
                <span className="rounded-md bg-[#e8eef2] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#5a6b7a]">
                  Draft
                </span>
              ) : null}
              {status === "draft" && isGhostWork ? (
                <span className="rounded-md bg-[#e8eef2] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#5a6b7a]">
                  In progress
                </span>
              ) : null}
            </div>
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
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Link
                href={href}
                className="inline-flex h-8 items-center rounded-md bg-primary-600 px-3 text-xs font-semibold text-white hover:bg-primary-700"
              >
                {openLabel}
              </Link>
              {isGhostWork && onOpenGhost ? (
                <button
                  type="button"
                  onClick={onOpenGhost}
                  className="inline-flex h-8 items-center gap-1.5 rounded-md border border-[#c5d0da] bg-white px-3 text-xs font-semibold text-[#0f2a3d] hover:bg-[#eef3f6]"
                >
                  <Ghost className="size-3.5" strokeWidth={1.8} aria-hidden />
                  Open ghost
                </button>
              ) : null}
            </div>
          </div>
          <div className="mt-4 flex items-center justify-end gap-2">
            <span className="text-[11px] text-[#8a9aab]">Created by</span>
            <span
              className="inline-flex size-7 items-center justify-center overflow-hidden rounded-full bg-surface-muted text-[10px] font-semibold text-text-secondary ring-2 ring-white"
              title={creatorName}
            >
              {exercise.createdBy.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={exercise.createdBy.avatarUrl} alt="" className="size-full object-cover" />
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
