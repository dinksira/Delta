"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Bookmark,
  Bold,
  ChevronDown,
  ChevronUp,
  ImageIcon,
  Italic,
  Link2,
  List,
  ListOrdered,
  Share2,
  Trash2,
  Trophy,
  Underline,
} from "lucide-react";
import { useState } from "react";

import { ApiError } from "@/lib/apiClient";
import { useAuthSession } from "@/contexts/AuthSession_Context";
import {
  approveCourseQaAnswer,
  bookmarkCourseQaQuestion,
  commentCourseQaAnswer,
  createCourseQaAnswer,
  fetchCourseQaQuestion,
  updateCourseQaQuestion,
  voteCourseQaAnswer,
  voteCourseQaQuestion,
  type CourseQaAnswerDto,
  type CourseQaQuestionDetailDto,
} from "@/modules/School/api";
import { relativeTimeLabel } from "@/modules/School/course/courseTablesMeta";
import { schoolQueryKeys } from "@/modules/School/hooks/schoolQueryKeys";

function authorLabel(a: CourseQaQuestionDetailDto["author"] | CourseQaAnswerDto["author"]): string {
  return a.fullName?.trim() || a.username || "Someone";
}

export function CourseQaQuestionDetail({
  orgId,
  schoolId,
  courseId,
  questionId,
  canMutate,
  onBack,
}: Readonly<{
  orgId: string;
  schoolId: string;
  courseId: string;
  questionId: string;
  canMutate: boolean;
  onBack: () => void;
}>) {
  const queryClient = useQueryClient();
  const { session } = useAuthSession();
  const userId = session?.user?.id ?? "";
  const [answerBody, setAnswerBody] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  const detailQuery = useQuery({
    queryKey: schoolQueryKeys.courseQaQuestion(orgId, schoolId, courseId, questionId),
    queryFn: () => fetchCourseQaQuestion(orgId, schoolId, courseId, questionId),
    staleTime: 5_000,
  });

  const invalidate = async () => {
    await queryClient.invalidateQueries({
      queryKey: schoolQueryKeys.courseQaQuestion(orgId, schoolId, courseId, questionId),
    });
    await queryClient.invalidateQueries({
      queryKey: ["school", "course-qa", "questions", orgId, schoolId, courseId],
    });
  };

  const voteQ = useMutation({
    mutationFn: (value: 1 | -1) =>
      voteCourseQaQuestion(orgId, schoolId, courseId, questionId, value),
    onSuccess: () => void invalidate(),
  });
  const bookmark = useMutation({
    mutationFn: () => bookmarkCourseQaQuestion(orgId, schoolId, courseId, questionId),
    onSuccess: () => void invalidate(),
  });
  const trash = useMutation({
    mutationFn: () =>
      updateCourseQaQuestion(orgId, schoolId, courseId, questionId, { status: "trash" }),
    onSuccess: () => onBack(),
  });
  const postAnswer = useMutation({
    mutationFn: () =>
      createCourseQaAnswer(orgId, schoolId, courseId, questionId, {
        body: answerBody.trim(),
        isAnonymous: anonymous,
      }),
    onSuccess: () => {
      setAnswerBody("");
      setAnonymous(false);
      void invalidate();
    },
    onError: (err) => {
      setError(err instanceof ApiError ? err.message : "Could not post answer.");
    },
  });
  const voteA = useMutation({
    mutationFn: ({ answerId, value }: { answerId: string; value: 1 | -1 }) =>
      voteCourseQaAnswer(orgId, schoolId, courseId, answerId, value),
    onSuccess: () => void invalidate(),
  });
  const approve = useMutation({
    mutationFn: (answerId: string) =>
      approveCourseQaAnswer(orgId, schoolId, courseId, questionId, answerId),
    onSuccess: () => void invalidate(),
  });
  const comment = useMutation({
    mutationFn: ({ answerId, text }: { answerId: string; text: string }) =>
      commentCourseQaAnswer(orgId, schoolId, courseId, answerId, text),
    onSuccess: (_data, vars) => {
      setCommentDrafts((prev) => ({ ...prev, [vars.answerId]: "" }));
      void invalidate();
    },
  });

  if (detailQuery.isPending) {
    return <div className="h-64 animate-pulse rounded-2xl border border-border-default bg-surface-muted/40" />;
  }
  if (detailQuery.isError || !detailQuery.data) {
    return (
      <div className="space-y-3">
        <button type="button" onClick={onBack} className="text-xs font-medium text-primary-700 hover:underline">
          ← Back to questions
        </button>
        <p className="text-sm text-red-600">
          {detailQuery.error instanceof ApiError
            ? detailQuery.error.message
            : "Could not load question."}
        </p>
      </div>
    );
  }

  const q = detailQuery.data;
  const isAuthor = q.author.userId === userId;
  const canModerate = canMutate || isAuthor;

  return (
    <div className="space-y-6">
      <button type="button" onClick={onBack} className="text-xs font-medium text-primary-700 hover:underline">
        ← Back to questions
      </button>

      <article className="flex gap-3 rounded-2xl border border-border-default bg-surface-default p-4 shadow-sm sm:gap-4 sm:p-5">
        <div className="flex shrink-0 flex-col items-center gap-2 pt-1 text-text-tertiary">
          <button
            type="button"
            onClick={() => bookmark.mutate()}
            className={["rounded-md p-1 hover:bg-surface-muted", q.bookmarkedByMe ? "text-primary-700" : ""].join(" ")}
          >
            <Bookmark className={["size-4", q.bookmarkedByMe ? "fill-current" : ""].join(" ")} aria-hidden />
          </button>
          {canModerate ? (
            <button
              type="button"
              onClick={() => {
                if (window.confirm("Move this question to trash?")) trash.mutate();
              }}
              className="rounded-md p-1 hover:bg-surface-muted hover:text-red-600"
            >
              <Trash2 className="size-4" aria-hidden />
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => void navigator.clipboard?.writeText(window.location.href)}
            className="rounded-md p-1 hover:bg-surface-muted hover:text-primary-700"
          >
            <Share2 className="size-4" aria-hidden />
          </button>
        </div>

        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-bold text-primary-900 sm:text-xl">
            <span className="text-primary-700">Q. </span>
            {q.title}
          </h2>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-text-secondary">{q.body}</p>
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
          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-text-tertiary">
            <span className="inline-flex items-center gap-1.5 text-text-secondary">
              <span className="inline-flex size-6 items-center justify-center rounded-full bg-surface-muted text-[10px] font-semibold">
                {authorLabel(q.author).slice(0, 2).toUpperCase()}
              </span>
              {authorLabel(q.author)}
            </span>
            <span>Asked {relativeTimeLabel(q.createdAt)}</span>
            <span className="font-medium text-primary-700">Replay privately</span>
          </div>
        </div>

        <div className="hidden w-28 shrink-0 flex-col items-end gap-2 text-xs sm:flex">
          <div className="flex flex-col items-center gap-0.5">
            <button type="button" onClick={() => voteQ.mutate(1)} className="text-text-tertiary hover:text-primary-700">
              <ChevronUp className="size-5" aria-hidden />
            </button>
            <span className="font-semibold text-text-secondary">{q.voteScore} votes</span>
            <button type="button" onClick={() => voteQ.mutate(-1)} className="text-text-tertiary hover:text-primary-700">
              <ChevronDown className="size-5" aria-hidden />
            </button>
          </div>
          <span
            className={[
              "inline-flex items-center gap-1 rounded-md px-2 py-1 font-semibold",
              q.answerCount > 0 ? "bg-emerald-500 text-white" : "bg-surface-muted text-text-tertiary",
            ].join(" ")}
          >
            {q.answerCount} answer{q.answerCount === 1 ? "" : "s"}
          </span>
          <p className="text-text-secondary">{q.viewCount} views</p>
        </div>
      </article>

      <div className="space-y-4">
        {q.answers.map((a) => (
          <AnswerBlock
            key={a.id}
            answer={a}
            canApprove={canModerate}
            commentDraft={commentDrafts[a.id] ?? ""}
            onCommentDraft={(text) =>
              setCommentDrafts((prev) => ({ ...prev, [a.id]: text }))
            }
            onVote={(value) => voteA.mutate({ answerId: a.id, value })}
            onApprove={() => approve.mutate(a.id)}
            onComment={() => {
              const text = (commentDrafts[a.id] ?? "").trim();
              if (!text) return;
              comment.mutate({ answerId: a.id, text });
            }}
            commenting={comment.isPending}
          />
        ))}
      </div>

      <section className="space-y-3 rounded-2xl border border-border-default bg-surface-default p-4 sm:p-5">
        <h3 className="text-base font-bold text-text-primary">Your Answer</h3>
        <div className="overflow-hidden rounded-xl border border-border-default">
          <div className="flex flex-wrap items-center gap-1.5 border-b border-border-default bg-surface-muted/30 px-2 py-1.5 text-text-tertiary">
            <Bold className="size-3.5" aria-hidden />
            <Italic className="size-3.5" aria-hidden />
            <Underline className="size-3.5" aria-hidden />
            <List className="size-3.5" aria-hidden />
            <ListOrdered className="size-3.5" aria-hidden />
            <Link2 className="size-3.5" aria-hidden />
            <ImageIcon className="size-3.5" aria-hidden />
          </div>
          <textarea
            value={answerBody}
            onChange={(e) => setAnswerBody(e.target.value)}
            rows={8}
            placeholder="Write your answer…"
            className="w-full resize-y border-0 bg-transparent px-3.5 py-3 text-sm outline-none placeholder:text-text-tertiary"
          />
        </div>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <label className="inline-flex items-center gap-2 text-sm text-text-secondary">
            <input
              type="checkbox"
              checked={anonymous}
              onChange={(e) => setAnonymous(e.target.checked)}
              className="rounded border-border-default"
            />
            Anonymous answer
          </label>
          <button
            type="button"
            disabled={!answerBody.trim() || postAnswer.isPending}
            onClick={() => {
              setError(null);
              postAnswer.mutate();
            }}
            className="rounded-xl bg-primary-800 px-6 py-2.5 text-sm font-semibold text-white hover:bg-primary-900 disabled:opacity-50"
          >
            {postAnswer.isPending ? "Posting…" : "Answer"}
          </button>
        </div>
      </section>
    </div>
  );
}

function AnswerBlock({
  answer,
  canApprove,
  commentDraft,
  onCommentDraft,
  onVote,
  onApprove,
  onComment,
  commenting,
}: Readonly<{
  answer: CourseQaAnswerDto;
  canApprove: boolean;
  commentDraft: string;
  onCommentDraft: (text: string) => void;
  onVote: (value: 1 | -1) => void;
  onApprove: () => void;
  onComment: () => void;
  commenting: boolean;
}>) {
  const [showComments, setShowComments] = useState(false);

  return (
    <article
      className={[
        "rounded-xl border border-border-default bg-surface-default p-4 sm:p-5",
        answer.isAccepted ? "border-l-4 border-l-emerald-500" : "",
      ].join(" ")}
    >
      <div className="flex gap-4">
        <div className="flex shrink-0 flex-col items-center gap-0.5 text-text-tertiary">
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-text-secondary">
            Answer
          </p>
          <button type="button" onClick={() => onVote(1)} className="hover:text-primary-700">
            <ChevronUp className="size-5" aria-hidden />
          </button>
          <span className="text-xs font-semibold text-text-secondary">{answer.voteScore} votes</span>
          <button type="button" onClick={() => onVote(-1)} className="hover:text-primary-700">
            <ChevronDown className="size-5" aria-hidden />
          </button>
        </div>
        <div className="min-w-0 flex-1">
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-text-secondary">
            {answer.body}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
            <button
              type="button"
              onClick={() => setShowComments((v) => !v)}
              className="font-medium text-text-secondary hover:text-primary-700"
            >
              Comments{answer.comments.length ? ` (${answer.comments.length})` : ""}
            </button>
            {canApprove && !answer.isAccepted ? (
              <button
                type="button"
                onClick={onApprove}
                className="inline-flex items-center gap-1 font-medium text-amber-700 hover:underline"
              >
                <Trophy className="size-3.5" aria-hidden />
                Approve Answer
              </button>
            ) : null}
            {answer.isAccepted ? (
              <span className="inline-flex items-center gap-1 font-semibold text-emerald-600">
                <Trophy className="size-3.5" aria-hidden />
                Approved
              </span>
            ) : null}
            <button type="button" className="font-medium text-text-tertiary hover:text-text-secondary">
              Report
            </button>
            <button
              type="button"
              onClick={() => void navigator.clipboard?.writeText(window.location.href)}
              className="font-medium text-text-tertiary hover:text-text-secondary"
            >
              Share
            </button>
            <span className="ml-auto inline-flex items-center gap-1.5 text-text-tertiary">
              <span className="inline-flex size-6 items-center justify-center rounded-full bg-surface-muted text-[10px] font-semibold text-text-secondary">
                {authorLabel(answer.author).slice(0, 2).toUpperCase()}
              </span>
              {authorLabel(answer.author)} · answered {relativeTimeLabel(answer.createdAt)}
            </span>
          </div>

          {showComments ? (
            <div className="mt-3 space-y-2 border-t border-border-default pt-3">
              {answer.comments.map((c) => (
                <p key={c.id} className="text-xs text-text-secondary">
                  <span className="font-semibold text-text-primary">{authorLabel(c.author)}</span>:{" "}
                  {c.text}
                </p>
              ))}
              <div className="flex gap-2">
                <input
                  value={commentDraft}
                  onChange={(e) => onCommentDraft(e.target.value)}
                  placeholder="Add a comment…"
                  className="min-w-0 flex-1 rounded-lg border border-border-default px-2.5 py-1.5 text-xs outline-none focus:border-primary-500"
                />
                <button
                  type="button"
                  disabled={!commentDraft.trim() || commenting}
                  onClick={onComment}
                  className="rounded-lg bg-primary-800 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                >
                  Comment
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
}
