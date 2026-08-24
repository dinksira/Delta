"use client";

import { useMutation } from "@tanstack/react-query";
import { Bold, ChevronDown, ImageIcon, Italic, Link2, List, ListOrdered, Underline } from "lucide-react";
import { useState } from "react";

import { ApiError } from "@/lib/apiClient";
import { createCourseQaQuestion } from "@/modules/School/api";

const fieldClass =
  "w-full rounded-xl border border-border-default bg-surface-default px-3.5 py-2.5 text-sm text-text-primary outline-none placeholder:text-text-tertiary focus:border-primary-500";

export function CourseQaAskForm({
  orgId,
  schoolId,
  courseId,
  onCancel,
  onPosted,
}: Readonly<{
  orgId: string;
  schoolId: string;
  courseId: string;
  onCancel: () => void;
  onPosted: (questionId: string) => void;
}>) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [tagsRaw, setTagsRaw] = useState("");
  const [visibility, setVisibility] = useState<"public" | "private">("public");
  const [pricing, setPricing] = useState<"free" | "paid">("free");
  const [featuresOpen, setFeaturesOpen] = useState(true);
  const [paymentOpen, setPaymentOpen] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const postMutation = useMutation({
    mutationFn: () => {
      const tags = tagsRaw
        .split(/[,#]+/)
        .map((t) => t.trim())
        .filter(Boolean)
        .slice(0, 5);
      return createCourseQaQuestion(orgId, schoolId, courseId, {
        title: title.trim(),
        body: body.trim(),
        tags,
        visibility,
        pricing,
      });
    },
    onSuccess: (q) => onPosted(q.id),
    onError: (err) => {
      setError(err instanceof ApiError ? err.message : "Could not post question.");
    },
  });

  const canPost = title.trim().length > 0 && body.trim().length >= 20 && !postMutation.isPending;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_16rem] lg:items-start">
      <div className="space-y-5">
        <section className="space-y-2">
          <h3 className="text-sm font-semibold text-text-primary">Question title</h3>
          <p className="text-xs text-text-tertiary">
            Be specific and imagine you&apos;re asking a question to another person.
          </p>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="eg. What is Newton's 2nd Law"
            className={fieldClass}
          />
        </section>

        <section className="space-y-2">
          <h3 className="text-sm font-semibold text-text-primary">
            What are the details of your problem?
          </h3>
          <p className="text-xs text-text-tertiary">
            Introduce the problem and expand on what you put in the title. Minimum 20 characters.
          </p>
          <div className="overflow-hidden rounded-xl border border-border-default">
            <div className="flex flex-wrap items-center gap-1.5 border-b border-border-default bg-surface-muted/30 px-2 py-1.5 text-text-tertiary">
              <Bold className="size-3.5" aria-hidden />
              <Italic className="size-3.5" aria-hidden />
              <Underline className="size-3.5" aria-hidden />
              <span className="mx-1 h-4 w-px bg-border-default" aria-hidden />
              <List className="size-3.5" aria-hidden />
              <ListOrdered className="size-3.5" aria-hidden />
              <Link2 className="size-3.5" aria-hidden />
              <ImageIcon className="size-3.5" aria-hidden />
            </div>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={10}
              placeholder="eg. What is Newton's 2nd Law"
              className="w-full resize-y border-0 bg-transparent px-3.5 py-3 text-sm outline-none placeholder:text-text-tertiary"
            />
          </div>
          {body.trim().length > 0 && body.trim().length < 20 ? (
            <p className="text-xs text-amber-700">{20 - body.trim().length} more characters needed</p>
          ) : null}
        </section>

        <section className="space-y-2">
          <h3 className="text-sm font-semibold text-text-primary">Tags</h3>
          <p className="text-xs text-text-tertiary">
            Add up to 5 tags to describe what your question is about. Start typing to see
            suggestions.
          </p>
          <input
            value={tagsRaw}
            onChange={(e) => setTagsRaw(e.target.value)}
            placeholder=".."
            className={fieldClass}
          />
        </section>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <div className="flex gap-2 lg:hidden">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-border-default px-4 py-2 text-sm font-semibold text-text-secondary"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!canPost}
            onClick={() => {
              setError(null);
              postMutation.mutate();
            }}
            className="rounded-xl bg-primary-800 px-5 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {postMutation.isPending ? "Posting…" : "Post"}
          </button>
        </div>
      </div>

      <aside className="space-y-3 rounded-2xl border border-border-default bg-surface-default p-4 shadow-sm">
        <button
          type="button"
          disabled={!canPost}
          onClick={() => {
            setError(null);
            postMutation.mutate();
          }}
          className="hidden w-full rounded-xl bg-primary-800 py-2.5 text-sm font-semibold text-white hover:bg-primary-900 disabled:opacity-50 lg:block"
        >
          {postMutation.isPending ? "Posting…" : "Post"}
        </button>

        <div className="rounded-xl border border-border-default">
          <button
            type="button"
            onClick={() => setFeaturesOpen((v) => !v)}
            className="flex w-full items-center justify-between px-3 py-2.5 text-left text-sm font-semibold text-text-primary"
          >
            Question Features
            <ChevronDown
              className={["size-4 transition-transform", featuresOpen ? "rotate-180" : ""].join(
                " ",
              )}
              aria-hidden
            />
          </button>
          {featuresOpen ? (
            <div className="space-y-3 border-t border-border-default px-3 py-3">
              <label className="block text-xs text-text-secondary">
                Visibility
                <select
                  value={visibility}
                  onChange={(e) => setVisibility(e.target.value as "public" | "private")}
                  className="mt-1 w-full rounded-lg border border-border-default bg-surface-default px-2.5 py-2 text-sm"
                >
                  <option value="public">Public</option>
                  <option value="private">Private</option>
                </select>
              </label>
              <button
                type="button"
                onClick={onCancel}
                className="text-xs font-semibold text-red-600 hover:underline"
              >
                Move to Trash
              </button>
            </div>
          ) : null}
        </div>

        <div className="rounded-xl border border-border-default">
          <button
            type="button"
            onClick={() => setPaymentOpen((v) => !v)}
            className="flex w-full items-center justify-between px-3 py-2.5 text-left text-sm font-semibold text-text-primary"
          >
            Payment
            <ChevronDown
              className={["size-4 transition-transform", paymentOpen ? "rotate-180" : ""].join(" ")}
              aria-hidden
            />
          </button>
          {paymentOpen ? (
            <div className="space-y-2 border-t border-border-default px-3 py-3 text-sm">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="pricing"
                  checked={pricing === "free"}
                  onChange={() => setPricing("free")}
                />
                Free
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="pricing"
                  checked={pricing === "paid"}
                  onChange={() => setPricing("paid")}
                />
                Paid
              </label>
            </div>
          ) : null}
        </div>
      </aside>
    </div>
  );
}
