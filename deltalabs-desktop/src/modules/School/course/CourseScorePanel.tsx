"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Fragment, useMemo, useState } from "react";

import { Button } from "@/components/theme";
import { ApiError } from "@/lib/apiClient";
import {
  fetchCourseScoreboard,
  seedCourseScoreboardDemo,
  type CourseScoreAssessmentDto,
  type CourseScoreBoardDto,
  type CourseScoreEntryDto,
  type SchoolWorkspaceItemDto,
} from "@/modules/School/api";
import { CourseExerciseManagementTableView } from "@/modules/School/course/CourseExerciseManagementTableView";
import { schoolQueryKeys } from "@/modules/School/hooks/schoolQueryKeys";

type ViewMode = "direct" | "table";

function formatScoreDate(iso: string): string {
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return "—";
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  return `${months[d.getMonth()]}/${String(d.getDate()).padStart(2, "0")}/${d.getFullYear()}`;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
}

function statusBarClass(percent: number): string {
  if (percent >= 80) return "bg-emerald-500";
  if (percent >= 50) return "bg-amber-400";
  return "bg-rose-400";
}

function lineTotalLabel(
  entry: CourseScoreEntryDto,
  assessment: CourseScoreAssessmentDto,
): string {
  const line = entry.lines.find((l) => l.assessmentId === assessment.id);
  if (!line || line.points == null) return `--/${assessment.maxPoints}`;
  return `${line.points}/${assessment.maxPoints}`;
}

function lineStatusPercent(
  entry: CourseScoreEntryDto,
  assessment: CourseScoreAssessmentDto,
): number {
  const line = entry.lines.find((l) => l.assessmentId === assessment.id);
  if (!line || line.points == null || assessment.maxPoints <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((line.points / assessment.maxPoints) * 100)));
}

export function CourseScorePanel({
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
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set());

  const boardQuery = useQuery({
    queryKey: schoolQueryKeys.courseScoreboard(orgId, schoolId, courseItem.id),
    queryFn: () => fetchCourseScoreboard(orgId, schoolId, courseItem.id),
    enabled: viewMode === "direct",
    staleTime: 0,
    refetchOnMount: "always",
  });

  const seedMutation = useMutation({
    mutationFn: () => seedCourseScoreboardDemo(orgId, schoolId, courseItem.id),
    onSuccess: async (board) => {
      queryClient.setQueryData(
        schoolQueryKeys.courseScoreboard(orgId, schoolId, courseItem.id),
        board,
      );
    },
  });

  const board = boardQuery.data;
  const entries = useMemo(() => board?.entries ?? [], [board?.entries]);
  const assessments = useMemo(() => board?.assessments ?? [], [board?.assessments]);

  const toggleExpanded = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (viewMode === "table") {
    return (
      <div className="space-y-5" aria-label="Score management table">
        <ViewToggle viewMode={viewMode} setViewMode={setViewMode} />
        <CourseExerciseManagementTableView
          orgId={orgId}
          schoolId={schoolId}
          courseItem={courseItem}
          canMutate={canMutate}
          surface="score"
        />
      </div>
    );
  }

  return (
    <div className="space-y-5" aria-label="Course Score">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <ViewToggle viewMode={viewMode} setViewMode={setViewMode} />
        {canMutate && entries.length === 0 && !boardQuery.isPending ? (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={seedMutation.isPending}
            onClick={() => seedMutation.mutate()}
          >
            {seedMutation.isPending ? "Loading…" : "Load sample board"}
          </Button>
        ) : null}
      </div>

      {boardQuery.isPending ? (
        <div className="h-64 animate-pulse rounded-xl border border-border-default bg-surface-muted/40" />
      ) : boardQuery.isError ? (
        <p className="text-sm text-red-600">
          {boardQuery.error instanceof ApiError
            ? boardQuery.error.message
            : "Could not load scoreboard."}
        </p>
      ) : seedMutation.isError ? (
        <p className="text-sm text-red-600">
          {seedMutation.error instanceof ApiError
            ? seedMutation.error.message
            : "Could not seed sample board."}
        </p>
      ) : entries.length === 0 ? (
        <div className="flex min-h-[18rem] flex-col items-center justify-center rounded-xl border border-dashed border-border-default bg-surface-muted/20 px-6 py-12 text-center">
          <p className="text-base font-semibold text-text-primary">No scores yet</p>
          <p className="mt-1 max-w-md text-sm text-text-secondary">
            The board starts with Mid Exam, Final Exam, and Quiz. Managers can load a sample board
            to preview the Direct View layout.
          </p>
        </div>
      ) : (
        <ScoreDirectTable
          board={board!}
          assessments={assessments}
          entries={entries}
          expandedIds={expandedIds}
          onToggle={toggleExpanded}
        />
      )}
    </div>
  );
}

function ScoreDirectTable({
  board,
  assessments,
  entries,
  expandedIds,
  onToggle,
}: Readonly<{
  board: CourseScoreBoardDto;
  assessments: readonly CourseScoreAssessmentDto[];
  entries: readonly CourseScoreEntryDto[];
  expandedIds: ReadonlySet<string>;
  onToggle: (id: string) => void;
}>) {
  return (
    <div className="overflow-hidden rounded-xl border border-border-default bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[40rem] border-collapse text-left">
          <thead>
            <tr className="border-b border-border-default bg-[#f3f5f7] text-[11px] font-semibold uppercase tracking-wide text-[#5a6b7a]">
              <th className="px-4 py-3 font-semibold">Student</th>
              <th className="px-3 py-3 font-semibold">Rank</th>
              <th className="px-3 py-3 font-semibold">Last update</th>
              <th className="px-3 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 text-right font-semibold">Total</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => {
              const open = expandedIds.has(entry.id);
              return (
                <Fragment key={entry.id}>
                  <tr className="border-b border-border-default/80 hover:bg-[#fafbfc]">
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        className="flex w-full items-center gap-3 text-left"
                        onClick={() => onToggle(entry.id)}
                        aria-expanded={open}
                      >
                        {open ? (
                          <ChevronDown className="size-4 shrink-0 text-[#8a9aab]" aria-hidden />
                        ) : (
                          <ChevronRight className="size-4 shrink-0 text-[#8a9aab]" aria-hidden />
                        )}
                        <span className="inline-flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#e8eef2] text-[11px] font-semibold text-primary-800">
                          {entry.avatarUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={entry.avatarUrl}
                              alt=""
                              className="size-full object-cover"
                            />
                          ) : (
                            initials(entry.displayName)
                          )}
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-semibold text-[#0f2a3d]">
                            {entry.displayName}
                          </span>
                          {entry.subtitle ? (
                            <span className="block truncate text-xs text-[#8a9aab]">
                              {entry.subtitle}
                            </span>
                          ) : null}
                        </span>
                      </button>
                    </td>
                    <td className="px-3 py-3 text-sm text-[#0f2a3d]">{entry.rank}</td>
                    <td className="px-3 py-3 text-sm text-[#5a6b7a]">
                      {formatScoreDate(entry.updatedAt || board.updatedAt)}
                    </td>
                    <td className="px-3 py-3">
                      <div className="h-2 w-28 overflow-hidden rounded-full bg-[#e8eef2]">
                        <div
                          className={`h-full rounded-full ${statusBarClass(entry.statusPercent)}`}
                          style={{ width: `${entry.statusPercent}%` }}
                        />
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-semibold text-[#0f2a3d]">
                      {Math.round(entry.totalPoints)}
                    </td>
                  </tr>
                  {open
                    ? assessments.map((a) => {
                        const pct = lineStatusPercent(entry, a);
                        const line = entry.lines.find((l) => l.assessmentId === a.id);
                        return (
                          <tr
                            key={`${entry.id}-${a.id}`}
                            className="border-b border-border-default/60 bg-[#eef5f8]"
                          >
                            <td className="px-4 py-2.5 pl-14 text-sm font-medium text-[#0f2a3d]">
                              {a.title}
                            </td>
                            <td className="px-3 py-2.5 text-sm text-[#5a6b7a]">
                              {line?.rank ?? "—"}
                            </td>
                            <td className="px-3 py-2.5 text-sm text-[#8a9aab]">—</td>
                            <td className="px-3 py-2.5">
                              <div className="h-2 w-28 overflow-hidden rounded-full bg-white/80">
                                <div
                                  className={`h-full rounded-full ${statusBarClass(pct)}`}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </td>
                            <td className="px-4 py-2.5 text-right text-sm text-[#0f2a3d]">
                              {lineTotalLabel(entry, a)}
                            </td>
                          </tr>
                        );
                      })
                    : null}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
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
