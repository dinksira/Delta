"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Bookmark,
  Check,
  ChevronDown,
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
    enabled: viewMode === "direct" && screen === "list",
    staleTime: 8_000,
  });

  const invalidateList = async () => {
    await queryClient.invalidateQueries({
      queryKey: ["school", "course-qa", "questions", orgId, schoolId, courseItem.id],
    });
  };

  const bookmarkMutation = useMutation({
    mutationFn: (questionId: string) =>
      bookmarkCourseQaQuestion(orgId, schoolId, courseItem.id, questionId),
    onSuccess: () => void invalidateList(),
  });

  const trashMutation = useMutation({
    mutationFn: (questionId: string) =>
      updateCourseQaQuestion(orgId, schoolId, courseItem.id, questionId, {
        status: "trash",
      }),
    onSuccess: () => void invalidateList(),
  });

  const items = useMemo(() => listQuery.data?.items ?? [], [listQuery.data?.items]);

  if (viewMode === "table") {
    return (
      <div className="space-y-5" aria-label="Course Q&A management table">
        <ViewToggle viewMode={viewMode} setViewMode={setViewMode} />
        <div className="flex min-h-[16rem] flex-col items-center justify-center rounded-xl border border-dashed border-border-default bg-surface-muted/20 px-6 py-14 text-center">
          <p className="text-sm font-semibold text-text-primary">No Table yet</p>
          <p className="mt-1 text-sm text-text-tertiary">
            Q&A management table is coming soon. Use Direct View for questions.
          </p>
        </div>
      </div>
    );
  }

  if (screen === "ask") {
    return (
      <div className="space-y-5" aria-label="Ask a question">
        <ViewToggle viewMode={viewMode} setViewMode={setViewMode} />
        <SubTabs subTab={subTab} setSubTab={setSubTab} />
        <CourseQaAskForm
          orgId={orgId}
          schoolId={schoolId}
          courseId={courseItem.id}
          onCancel={() => setScreen("list")}
          onPosted={(id) => {
            void invalidateList();
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
        <ViewToggle viewMode={viewMode} setViewMode={setViewMode} />
        <CourseQaQuestionDetail
          orgId={orgId}
          schoolId={schoolId}
          courseId={courseItem.id}
          questionId={activeQuestionId}
          canMutate={canMutate}
          onBack={() => {
            setScreen("list");
            setActiveQuestionId(null);
            void invalidateList();
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-5" aria-label="Course Q&A">
      <ViewToggle viewMode={viewMode} setViewMode={setViewMode} />
      <SubTabs subTab={subTab} setSubTab={setSubTab} />

      {subTab === "community" ? (
        <div className="flex min-h-[14rem] flex-col items-center justify-center rounded-xl border border-dashed border-border-default px-6 py-12 text-center">
          <p className="text-sm font-semibold text-text-primary">Community</p>
          <p className="mt-1 max-w-sm text-xs text-text-tertiary">
            Community discussions for this course will appear here. Use Questions for Stack
            Overflow–style Q&A.
          </p>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="mx-auto flex w-full max-w-xl flex-1 items-center gap-2 sm:mx-0">
              <label className="flex min-w-0 flex-1 items-center gap-2 rounded-full border border-border-default bg-surface-default px-4 py-2.5 shadow-sm">
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
                className="inline-flex size-10 shrink-0 items-center justify-center rounded-xl border border-border-default bg-surface-default text-text-secondary hover:bg-surface-muted"
                aria-label="Filter"
              >
                <Filter className="size-4" aria-hidden />
              </button>
            </div>
            <button
              type="button"
              onClick={() => setScreen("ask")}
              className="inline-flex items-center gap-2 rounded-xl bg-primary-100 px-4 py-2.5 text-sm font-semibold text-primary-800 transition-colors hover:bg-primary-200"
            >
              <MessageCircleQuestion className="size-4" aria-hidden />
              Ask Questions
            </button>
          </div>

          {listQuery.isPending ? (
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
              <p className="mt-1 text-sm text-text-tertiary">
                Ask the first question for this course.
              </p>
            </div>
          ) : (
            <ul className="space-y-4">
              {items.map((q) => (
                <li key={q.id}>
                  <article className="flex gap-3 rounded-2xl border border-border-default bg-surface-default p-4 shadow-sm sm:gap-4 sm:p-5">
                    <div className="flex shrink-0 flex-col items-center gap-2 pt-1 text-text-tertiary">
                      <button
                        type="button"
                        title="Bookmark"
                        onClick={() => bookmarkMutation.mutate(q.id)}
                        className={[
                          "rounded-md p-1 hover:bg-surface-muted hover:text-primary-700",
                          q.bookmarkedByMe ? "text-primary-700" : "",
                        ].join(" ")}
                      >
                        <Bookmark
                          className={["size-4", q.bookmarkedByMe ? "fill-current" : ""].join(" ")}
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
                        className="rounded-md p-1 hover:bg-surface-muted hover:text-red-600"
                      >
                        <Trash2 className="size-4" aria-hidden />
                      </button>
                      <button
                        type="button"
                        title="Share"
                        onClick={() => {
                          void navigator.clipboard?.writeText(window.location.href);
                        }}
                        className="rounded-md p-1 hover:bg-surface-muted hover:text-primary-700"
                      >
                        <Share2 className="size-4" aria-hidden />
                      </button>
                    </div>

                    <div className="min-w-0 flex-1">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveQuestionId(q.id);
                          setScreen("detail");
                        }}
                        className="text-left"
                      >
                        <h3 className="text-base font-bold text-primary-900 sm:text-lg">
                          <span className="font-semibold text-primary-700">Q. </span>
                          {q.title}
                        </h3>
                        <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-text-secondary">
                          {snippet(q.body)}
                        </p>
                      </button>

                      {q.tags.length > 0 ? (
                        <ul className="mt-3 flex flex-wrap gap-1.5">
                          {q.tags.map((tag) => (
                            <li
                              key={tag}
                              className="rounded-md bg-primary-100 px-2 py-0.5 text-[11px] font-medium text-primary-800"
                            >
                              {tag}
                            </li>
                          ))}
                        </ul>
                      ) : null}

                      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-text-tertiary">
                        <span className="inline-flex items-center gap-1.5 text-text-secondary">
                          <span className="inline-flex size-6 items-center justify-center overflow-hidden rounded-full bg-surface-muted text-[10px] font-semibold">
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
                          {authorDisplay(q)}
                        </span>
                        <span>Asked {relativeTimeLabel(q.createdAt)}</span>
                        <button
                          type="button"
                          className="font-medium text-primary-700 hover:underline"
                          onClick={() => {
                            setActiveQuestionId(q.id);
                            setScreen("detail");
                          }}
                        >
                          Replay privately
                        </button>
                      </div>
                    </div>

                    <div className="hidden w-[6.5rem] shrink-0 flex-col items-end gap-2 text-xs text-text-secondary sm:flex">
                      <p>{q.voteScore} votes</p>
                      <span
                        className={[
                          "inline-flex items-center gap-1 rounded-md px-2 py-1 font-semibold",
                          q.answerCount > 0
                            ? "bg-emerald-500 text-white"
                            : "bg-surface-muted text-text-tertiary",
                        ].join(" ")}
                      >
                        {q.answerCount > 0 ? <Check className="size-3" aria-hidden /> : null}
                        {q.answerCount} answer{q.answerCount === 1 ? "" : "s"}
                      </span>
                      <p>{q.viewCount} views</p>
                    </div>
                  </article>
                </li>
              ))}
            </ul>
          )}
        </>
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
      <span className="mx-1 h-5 w-px bg-border-default" aria-hidden />
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
    <div className="flex items-end gap-4 border-b border-border-default">
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
                ? "font-bold text-primary-900"
                : "font-medium text-text-secondary hover:text-text-primary",
            ].join(" ")}
          >
            {label}
            {active ? (
              <span className="absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-primary-700" />
            ) : null}
          </button>
        );
      })}
      <ChevronDown className="mb-2.5 ml-auto size-4 text-text-tertiary sm:hidden" aria-hidden />
    </div>
  );
}
