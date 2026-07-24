"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Bookmark,
  Check,
  Filter,
  HelpCircle,
  MessageCircleQuestion,
  Search,
  Share2,
  Trash2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { ApiError } from "@/lib/apiClient";
import {
  bookmarkCourseQaQuestion,
  fetchCourseQaQuestions,
  updateCourseQaQuestion,
  type CourseQaQuestionDto,
  type SchoolWorkspaceItemDto,
} from "@/modules/School/api";
import { CourseQaAskForm } from "@/modules/School/course/CourseQaAskForm";
import { CourseQaQuestionDetail } from "@/modules/School/course/CourseQaQuestionDetail";
import { relativeTimeLabel } from "@/modules/School/course/courseTablesMeta";
import { schoolQueryKeys } from "@/modules/School/hooks/schoolQueryKeys";

type ViewMode = "direct" | "table";
type QaSubTab = "questions" | "community";
type Screen = "list" | "ask" | "detail";

function authorDisplay(q: CourseQaQuestionDto): string {
  return q.author.fullName?.trim() || q.author.username || "Someone";
}

function snippet(body: string, max = 160): string {
  const t = body.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

export function CourseQaPanel({
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
  const [subTab, setSubTab] = useState<QaSubTab>("questions");
  const [screen, setScreen] = useState<Screen>("list");
  const [activeQuestionId, setActiveQuestionId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedSearch(search), 280);
    return () => window.clearTimeout(t);
  }, [search]);

  const listQuery = useQuery({
    queryKey: schoolQueryKeys.courseQaQuestions(
      orgId,
      schoolId,
      courseItem.id,
      debouncedSearch,
      "",
    ),
    queryFn: () =>
      fetchCourseQaQuestions(orgId, schoolId, courseItem.id, {
        q: debouncedSearch || undefined,
      }),
    // Keep active while on ask/detail so invalidate/refetch actually runs (not only when list is shown).
    enabled: viewMode === "direct",
    staleTime: 0,
    refetchOnMount: "always",
  });

  const refreshQuestionList = async () => {
    await queryClient.invalidateQueries({
      queryKey: ["school", "course-qa", "questions", orgId, schoolId, courseItem.id],
    });
    await queryClient.refetchQueries({
      queryKey: ["school", "course-qa", "questions", orgId, schoolId, courseItem.id],
    });
  };

  const bookmarkMutation = useMutation({
    mutationFn: (questionId: string) =>
      bookmarkCourseQaQuestion(orgId, schoolId, courseItem.id, questionId),
    onSuccess: () => void refreshQuestionList(),
  });

  const trashMutation = useMutation({
    mutationFn: (questionId: string) =>
      updateCourseQaQuestion(orgId, schoolId, courseItem.id, questionId, {
        status: "trash",
      }),
    onSuccess: () => void refreshQuestionList(),
  });

  // When returning to the list, always pull latest questions.
  useEffect(() => {
    if (screen !== "list") return;
    void queryClient.refetchQueries({
      queryKey: ["school", "course-qa", "questions", orgId, schoolId, courseItem.id],
    });
  }, [screen, orgId, schoolId, courseItem.id, queryClient]);

  const items = useMemo(() => listQuery.data?.items ?? [], [listQuery.data?.items]);

  const askButton = (
    <button
      type="button"
      onClick={() => setScreen("ask")}
      className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-[#d7e4ec] px-4 py-2.5 text-sm font-semibold text-primary-900 transition-colors hover:bg-[#c9d9e4]"
    >
      <MessageCircleQuestion className="size-4" aria-hidden />
      Ask Questions
    </button>
  );

  const searchFilter = (
    <div className="flex min-w-0 flex-1 items-center justify-end gap-2 sm:max-w-md sm:flex-none">
      <label className="flex min-w-0 flex-1 items-center gap-2 rounded-full border border-border-default bg-surface-default px-4 py-2 shadow-sm sm:w-72 sm:flex-none">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search..."
          className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-text-tertiary"
        />
        <Search className="size-4 shrink-0 text-text-tertiary" aria-hidden />
      </label>
      <button
        type="button"
        className="inline-flex size-9 shrink-0 items-center justify-center rounded-lg text-text-secondary hover:bg-surface-muted"
        aria-label="Filter"
      >
        <Filter className="size-4" aria-hidden />
      </button>
    </div>
  );

  if (screen === "ask") {
    return (
      <div className="space-y-5" aria-label="Ask a question">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <ViewToggle viewMode={viewMode} setViewMode={setViewMode} />
        </div>
        <CourseQaAskForm
          orgId={orgId}
          schoolId={schoolId}
          courseId={courseItem.id}
          onCancel={() => setScreen("list")}
          onPosted={async (id) => {
            await refreshQuestionList();
            setActiveQuestionId(id);
            setScreen("detail");
          }}
        />
      </div>
    );
  }

  if (screen === "detail" && activeQuestionId) {
    return (
      <div className="space-y-5" aria-label="Question detail">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <ViewToggle viewMode={viewMode} setViewMode={setViewMode} />
        </div>
        <CourseQaQuestionDetail
          orgId={orgId}
          schoolId={schoolId}
          courseId={courseItem.id}
          questionId={activeQuestionId}
          canMutate={canMutate}
          onBack={() => {
            setActiveQuestionId(null);
            setScreen("list");
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-5" aria-label="Course Q&A">
      {/* Row 1 — Figma: Direct View | Management Table …… Ask Questions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <ViewToggle viewMode={viewMode} setViewMode={setViewMode} />
        {askButton}
      </div>

      {/* Row 2 — Figma: Questions | Community …… Search + filter */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <SubTabs subTab={subTab} setSubTab={setSubTab} />
        {searchFilter}
      </div>

      {subTab === "community" ? (
        <div className="flex min-h-[14rem] flex-col items-center justify-center rounded-xl border border-dashed border-border-default px-6 py-12 text-center">
          <p className="text-sm font-semibold text-text-primary">Community</p>
          <p className="mt-1 max-w-sm text-xs text-text-tertiary">
            Community discussions for this course will appear here. Use Questions for Stack
            Overflow–style Q&A.
          </p>
        </div>
      ) : listQuery.isPending ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-36 animate-pulse rounded-2xl border border-border-default bg-surface-muted/40"
            />
          ))}
        </div>
      ) : listQuery.isError ? (
        <p className="text-sm text-red-600">
          {listQuery.error instanceof ApiError
            ? listQuery.error.message
            : "Could not load questions."}
        </p>
      ) : items.length === 0 ? (
        <div className="flex min-h-[14rem] flex-col items-center justify-center px-4 py-12 text-center">
          <HelpCircle className="mb-3 size-12 text-text-tertiary" strokeWidth={1.2} aria-hidden />
          <p className="text-base font-semibold text-text-primary">No questions yet</p>
          <p className="mt-1 text-sm text-text-tertiary">Ask the first question for this course.</p>
        </div>
      ) : (
        <ul className="space-y-4">
          {items.map((q) => (
            <li key={q.id}>
              <article className="flex gap-3 rounded-2xl border border-border-default bg-white p-4 shadow-[0_1px_3px_rgba(15,40,60,0.06)] sm:gap-5 sm:p-5">
                <div className="flex shrink-0 flex-col items-center gap-2.5 pt-0.5 text-[#8a9aab]">
                  <button
                    type="button"
                    title="Bookmark"
                    onClick={() => bookmarkMutation.mutate(q.id)}
                    className={[
                      "rounded-md p-0.5 hover:text-primary-700",
                      q.bookmarkedByMe ? "text-primary-700" : "",
                    ].join(" ")}
                  >
                    <Bookmark
                      className={["size-[1.125rem]", q.bookmarkedByMe ? "fill-current" : ""].join(
                        " ",
                      )}
                      aria-hidden
                    />
                  </button>
                  <button
                    type="button"
                    title="Move to trash"
                    onClick={() => {
                      if (window.confirm("Move this question to trash?")) {
                        trashMutation.mutate(q.id);
                      }
                    }}
                    className="rounded-md p-0.5 hover:text-red-600"
                  >
                    <Trash2 className="size-[1.125rem]" aria-hidden />
                  </button>
                  <button
                    type="button"
                    title="Share"
                    onClick={() => {
                      void navigator.clipboard?.writeText(window.location.href);
                    }}
                    className="rounded-md p-0.5 hover:text-primary-700"
                  >
                    <Share2 className="size-[1.125rem]" aria-hidden />
                  </button>
                </div>

                <div className="min-w-0 flex-1">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveQuestionId(q.id);
                      setScreen("detail");
                    }}
                    className="w-full text-left"
                  >
                    <h3 className="text-[15px] font-bold leading-snug text-[#0f2a3d] sm:text-base">
                      <span className="font-bold">Q. </span>
                      {q.title}
                    </h3>
                    <p className="mt-2 line-clamp-2 text-[13px] leading-relaxed text-[#5a6b7a]">
                      {snippet(q.body, 180)}
                    </p>
                  </button>

                  {q.tags.length > 0 ? (
                    <ul className="mt-3 flex flex-wrap gap-1.5">
                      {q.tags.map((tag) => (
                        <li
                          key={tag}
                          className="rounded-md bg-[#d6e7f2] px-2.5 py-0.5 text-[11px] font-medium text-[#2a5a78]"
                        >
                          {tag}
                        </li>
                      ))}
                    </ul>
                  ) : null}

                  <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                    <span className="inline-flex items-center gap-2 text-[#2a4a5c]">
                      <span className="inline-flex size-6 items-center justify-center overflow-hidden rounded-md bg-surface-muted text-[10px] font-semibold">
                        {q.author.avatarUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={q.author.avatarUrl}
                            alt=""
                            className="size-full object-cover"
                          />
                        ) : (
                          authorDisplay(q).slice(0, 2).toUpperCase()
                        )}
                      </span>
                      <span className="font-medium">{authorDisplay(q)}</span>
                    </span>
                    <span className="text-[#8a9aab]">Asked {relativeTimeLabel(q.createdAt)}</span>
                    <button
                      type="button"
                      className="font-medium text-[#2f6f9f] hover:underline"
                      onClick={() => {
                        setActiveQuestionId(q.id);
                        setScreen("detail");
                      }}
                    >
                      Reply privately
                    </button>
                  </div>
                </div>

                <div className="hidden w-[7rem] shrink-0 flex-col items-end justify-start gap-2 pt-1 text-xs text-[#8a9aab] sm:flex">
                  <p>{q.voteScore} votes</p>
                  <span
                    className={[
                      "inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-[12px] font-semibold",
                      q.answerCount > 0
                        ? "bg-[#3db87a] text-white"
                        : "bg-surface-muted text-text-tertiary",
                    ].join(" ")}
                  >
                    {q.answerCount > 0 ? <Check className="size-3.5" strokeWidth={2.5} aria-hidden /> : null}
                    {q.answerCount} answer{q.answerCount === 1 ? "" : "s"}
                  </span>
                  <p>{q.viewCount} views</p>
                </div>
              </article>
            </li>
          ))}
        </ul>
      )}
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

function SubTabs({
  subTab,
  setSubTab,
}: Readonly<{
  subTab: QaSubTab;
  setSubTab: (t: QaSubTab) => void;
}>) {
  return (
    <div className="flex items-end gap-5">
      {(
        [
          ["questions", "Questions"],
          ["community", "Community"],
        ] as const
      ).map(([id, label]) => {
        const active = subTab === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => setSubTab(id)}
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
  );
}
