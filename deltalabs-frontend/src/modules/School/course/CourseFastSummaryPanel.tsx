"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Clock, FileText, Ghost } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { Button } from "@/components/theme";
import { ApiError } from "@/lib/apiClient";
import {
  createCourseSummary,
  fetchCourseSummaries,
  type CourseSummaryDto,
  type SchoolWorkspaceItemDto,
} from "@/modules/School/api";
import { CourseExerciseManagementTableView } from "@/modules/School/course/CourseExerciseManagementTableView";
import { CreateFastSummaryModal } from "@/modules/School/course/summary/CreateFastSummaryModal";
import { GhostDrawer } from "@/modules/School/ghost";
import { schoolQueryKeys } from "@/modules/School/hooks/schoolQueryKeys";

type ViewMode = "direct" | "table";

export function CourseFastSummaryPanel({
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
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useState<ViewMode>("direct");
  const [createOpen, setCreateOpen] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [ghostOpen, setGhostOpen] = useState(false);
  const [ghostId, setGhostId] = useState<string | null>(null);
  const [opsInstanceId, setOpsInstanceId] = useState<string | null>(null);
  const [openGhostOpsBoard, setOpenGhostOpsBoard] = useState(false);

  const listQuery = useQuery({
    queryKey: schoolQueryKeys.courseSummaries(orgId, schoolId, courseItem.id),
    queryFn: () => fetchCourseSummaries(orgId, schoolId, courseItem.id),
    enabled: viewMode === "direct",
    staleTime: 0,
    refetchOnMount: "always",
  });

  const createMutation = useMutation({
    mutationFn: (payload: {
      title: string;
      summaryType: string;
      section: string;
      layout: "stack" | "split";
    }) =>
      createCourseSummary(orgId, schoolId, courseItem.id, {
        title: payload.title,
        summaryType: payload.summaryType,
        section: payload.section,
        layout: payload.layout,
        status: "draft",
        bodyHtml: "",
      }),
    onSuccess: async (summary) => {
      setCreateOpen(false);
      setCreateError(null);
      await queryClient.invalidateQueries({
        queryKey: schoolQueryKeys.courseSummaries(orgId, schoolId, courseItem.id),
      });
      router.push(
        `/features/school/${encodeURIComponent(schoolId)}/course/${encodeURIComponent(courseItem.id)}/summaries/${encodeURIComponent(summary.id)}/edit`,
      );
    },
    onError: (err) => {
      setCreateError(err instanceof ApiError ? err.message : "Could not create summary.");
    },
  });

  const items = useMemo(() => listQuery.data?.items ?? [], [listQuery.data?.items]);

  const openCreateModal = () => {
    setCreateError(null);
    setCreateOpen(true);
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
        slotKey: "course.summary.resource",
        resourceKind: "fast_summary",
        defaultNodeName: "Summary resource",
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
      <div className="space-y-5" aria-label="Fast Summary management table">
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
          surface="summary"
        />
        {ghostDrawer}
      </div>
    );
  }

  return (
    <div className="space-y-5" aria-label="Course Fast Summary">
      <ViewToggle viewMode={viewMode} setViewMode={setViewMode} />

      <div className="flex flex-wrap items-end justify-between gap-3">
        <p className="pb-2.5 text-sm font-bold text-[#0f2a3d]">Fast Summary</p>
        <Button
          type="button"
          variant="primary"
          size="md"
          disabled={!canMutate}
          onClick={openCreateModal}
        >
          Define Fast Summary
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
            : "Could not load summaries."}
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
            <p className="text-sm font-medium text-[#5a6b7a]">Open ghost workspace</p>
            <Ghost className="mt-4 size-10 text-primary-800" strokeWidth={1.4} aria-hidden />
          </button>

          {items.map((summary) => (
            <SummaryCard
              key={summary.id}
              summary={summary}
              href={`/features/school/${encodeURIComponent(schoolId)}/course/${encodeURIComponent(courseItem.id)}/summaries/${encodeURIComponent(summary.id)}/edit`}
              onOpenGhost={
                summary.ghostId
                  ? () => {
                      setGhostId(summary.ghostId!);
                      setGhostOpen(true);
                    }
                  : undefined
              }
            />
          ))}
        </div>
      )}

      <CreateFastSummaryModal
        open={createOpen}
        busy={createMutation.isPending}
        error={createError}
        onClose={() => !createMutation.isPending && setCreateOpen(false)}
        onStart={(payload) => createMutation.mutate(payload)}
      />

      {ghostDrawer}
    </div>
  );
}

function SummaryCard({
  summary,
  href,
  onOpenGhost,
}: Readonly<{
  summary: CourseSummaryDto;
  href: string;
  onOpenGhost?: () => void;
}>) {
  const creatorName =
    summary.createdBy?.fullName?.trim() ||
    summary.createdBy?.username ||
    summary.orgLabel?.trim() ||
    "Someone";
  const initials = creatorName.slice(0, 2).toUpperCase();
  const status = summary.status ?? "published";
  const isGhostWork =
    Boolean(summary.ghostId?.trim()) && (summary.status ?? "published") !== "published";
  const readLabel =
    summary.readMinutes != null && summary.readMinutes > 0
      ? `${summary.readMinutes} min read`
      : "—";
  const preview =
    summary.bodyHtml?.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() || "No content yet.";
  const openLabel =
    isGhostWork || status === "draft" ? "Continue editing" : "Open summary";

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
            "relative flex h-36 w-full shrink-0 flex-col items-center justify-center gap-2 sm:h-auto sm:w-[42%]",
            isGhostWork ? "bg-[#e8eef2] text-primary-800" : "bg-surface-muted text-text-tertiary",
          ].join(" ")}
        >
          {isGhostWork ? (
            <>
              <Ghost className="size-10" strokeWidth={1.4} aria-hidden />
              <span className="text-[11px] font-medium text-[#5a6b7a]">Ghost work</span>
            </>
          ) : (
            <FileText className="size-10" aria-hidden />
          )}
        </div>
        <div className="flex min-w-0 flex-1 flex-col justify-between p-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-bold text-[#0f2a3d]">{summary.title}</h3>
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
            <p className="mt-2 line-clamp-2 text-xs text-[#5a6b7a]">{preview}</p>
            <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-[#5a6b7a]">
              <span className="inline-flex items-center gap-1.5 capitalize">
                <FileText className="size-3.5" aria-hidden />
                {summary.summaryType || "academic"}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Clock className="size-3.5" aria-hidden />
                {readLabel}
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
              {summary.createdBy?.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={summary.createdBy.avatarUrl} alt="" className="size-full object-cover" />
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
