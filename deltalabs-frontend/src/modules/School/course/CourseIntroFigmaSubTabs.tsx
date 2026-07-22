"use client";

import { useQuery } from "@tanstack/react-query";
import {
  Bold,
  CheckSquare,
  ImageIcon,
  Italic,
  List,
  ListOrdered,
  Play,
  Radio,
  Search,
  Star,
  Underline,
  Users,
  X,
} from "lucide-react";
import { useMemo, useRef, useState, type ReactNode } from "react";

import {
  fetchSchoolWorkspaceItems,
  uploadSchoolMediaFile,
  type SchoolWorkspaceItemDto,
} from "@/modules/School/api";
import {
  averageReviewRating,
  reviewStarBreakdown,
  type CourseIntroDoc,
  type CourseIntroRelatedCourse,
  type CourseIntroSubTabId,
} from "@/modules/School/course/courseIntroTypes";

const fieldClass =
  "w-full rounded-xl border border-border-default bg-surface-default px-4 py-3 text-sm text-text-primary placeholder:text-text-tertiary outline-none transition-colors focus:border-primary-500";

type PanelsProps = Readonly<{
  subTab: CourseIntroSubTabId;
  doc: CourseIntroDoc;
  orgId: string;
  schoolId: string;
  courseTitle: string;
  currentCourseId: string;
  canMutate: boolean;
  busy: boolean;
  onPersist: (next: CourseIntroDoc) => void;
}>;

export function CourseIntroFigmaSubTabs(props: PanelsProps) {
  const { subTab } = props;
  if (subTab === "about") return <AboutCoursePanel {...props} />;
  if (subTab === "related") return <RelatedCoursesPanel {...props} />;
  if (subTab === "reviews") return <ReviewsRatingPanel {...props} />;
  if (subTab === "prerequisites") return <PrerequisitesPanel {...props} />;
  if (subTab === "analysis") return <CourseAnalysisPanel {...props} />;
  return null;
}

function AboutCoursePanel({
  doc,
  orgId,
  courseTitle,
  canMutate,
  busy,
  onPersist,
}: PanelsProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploadingCover, setUploadingCover] = useState(false);
  const about = doc.about;
  const avg = averageReviewRating(doc.reviews);
  const reviewCount = doc.reviews.length;

  const patchAbout = (patch: Partial<typeof about>) => {
    onPersist({ ...doc, about: { ...about, ...patch } });
  };

  const onCoverFile = async (file: File) => {
    if (!canMutate) return;
    setUploadingCover(true);
    try {
      const uploaded = await uploadSchoolMediaFile(orgId, file, {
        caption: "Course cover image",
        visibility: "org",
        publishToFeed: false,
      });
      const url = uploaded.playbackUrl || uploaded.referenceUrl;
      patchAbout({ coverImageUrl: url });
    } finally {
      setUploadingCover(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-3xl space-y-4">
      <button
        type="button"
        disabled={!canMutate || busy || uploadingCover}
        onClick={() => fileRef.current?.click()}
        className="flex min-h-[11rem] w-full flex-col items-center justify-center rounded-2xl border border-dashed border-border-default bg-surface-muted/25 px-6 py-10 text-center transition-colors hover:bg-surface-muted/40 disabled:opacity-60"
      >
        {about.coverImageUrl && !about.coverImageUrl.startsWith("media://") ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={about.coverImageUrl}
            alt="Course cover"
            className="mb-3 max-h-40 w-full rounded-xl object-cover"
          />
        ) : (
          <ImageIcon className="size-10 text-text-tertiary" strokeWidth={1.25} aria-hidden />
        )}
        <p className="mt-2 text-sm font-semibold text-text-primary">Course Cover Image</p>
        <p className="mt-1 text-xs text-text-tertiary">
          {uploadingCover ? "Uploading…" : "drop your image here"}
        </p>
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) void onCoverFile(file);
        }}
      />

      <input
        value={about.courseName || courseTitle}
        disabled={!canMutate || busy}
        onChange={(e) => patchAbout({ courseName: e.target.value })}
        placeholder="Write your Course Name here..."
        className={[fieldClass, "text-base font-medium"].join(" ")}
      />

      <div className="flex flex-wrap items-center gap-4 px-1 text-sm text-text-secondary">
        <div className="flex items-center gap-1.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={[
                "size-4",
                i < Math.round(avg) ? "fill-amber-400 text-amber-400" : "text-border-default",
              ].join(" ")}
              aria-hidden
            />
          ))}
          <span className="text-text-tertiary">({reviewCount} Reviews)</span>
        </div>
        <span className="h-4 w-px bg-border-default" aria-hidden />
        <span>{about.enrolledCount} enrolled</span>
      </div>

      <input
        value={about.welcomeMessage}
        disabled={!canMutate || busy}
        onChange={(e) => patchAbout({ welcomeMessage: e.target.value })}
        placeholder="Write your welcome message here..."
        className={fieldClass}
      />

      <textarea
        value={about.details || about.summary}
        disabled={!canMutate || busy}
        onChange={(e) =>
          patchAbout({ details: e.target.value, summary: e.target.value })
        }
        rows={8}
        placeholder="Write details about the course here..."
        className={[fieldClass, "min-h-[12rem] resize-y"].join(" ")}
      />
    </div>
  );
}

function RelatedCoursesPanel({
  doc,
  orgId,
  schoolId,
  currentCourseId,
  canMutate,
  busy,
  onPersist,
}: PanelsProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const related = doc.relatedCourses;
  const hasRelated = related.length > 0 || doc.relatedCourseIds.length > 0;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col items-center px-4 py-10 text-center">
      {hasRelated ? (
        <ul className="grid w-full gap-4 sm:grid-cols-2">
          {(related.length
            ? related
            : doc.relatedCourseIds.map((id) => ({
                id,
                title: id,
                orgLabel: "",
                rating: 0,
                coverUrl: "",
              }))
          ).map((c) => (
            <li
              key={c.id}
              className="overflow-hidden rounded-2xl border border-border-default bg-surface-default text-left shadow-sm"
            >
              <div className="relative aspect-[16/10] bg-surface-muted">
                {c.coverUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.coverUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <Play className="size-10 text-white drop-shadow" aria-hidden />
                  </div>
                )}
              </div>
              <div className="p-3">
                <p className="text-sm font-semibold text-text-primary">{c.title}</p>
                {c.orgLabel ? (
                  <p className="mt-0.5 text-xs text-text-tertiary">{c.orgLabel}</p>
                ) : null}
                <p className="mt-1 flex items-center gap-1 text-xs text-text-secondary">
                  <Star className="size-3 fill-amber-400 text-amber-400" aria-hidden />
                  ({c.rating || "4.8"} Reviews)
                </p>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <>
          <div className="relative mb-5 flex size-32 items-center justify-center">
            <div className="absolute inset-2 rounded-2xl border border-dashed border-border-default bg-surface-muted/40" />
            <Search className="relative size-16 text-text-tertiary" strokeWidth={1.05} aria-hidden />
          </div>
          <p className="text-base font-semibold text-text-primary">No Related Course Yet!</p>
          <p className="mt-1 text-sm text-text-tertiary">Add new related course</p>
        </>
      )}

      <button
        type="button"
        disabled={!canMutate || busy}
        onClick={() => setModalOpen(true)}
        className="mt-8 inline-flex items-center gap-2 rounded-xl bg-primary-700 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-800 disabled:opacity-50"
      >
        Search your related course
      </button>

      {modalOpen ? (
        <RelatedCoursePickerModal
          orgId={orgId}
          schoolId={schoolId}
          currentCourseId={currentCourseId}
          selectedIds={doc.relatedCourseIds}
          onClose={() => setModalOpen(false)}
          onAdd={(courses) => {
            onPersist({
              ...doc,
              relatedCourseIds: courses.map((c) => c.id),
              relatedCourses: courses,
            });
            setModalOpen(false);
          }}
        />
      ) : null}
    </div>
  );
}

function RelatedCoursePickerModal({
  orgId,
  schoolId,
  currentCourseId,
  selectedIds,
  onClose,
  onAdd,
}: Readonly<{
  orgId: string;
  schoolId: string;
  currentCourseId: string;
  selectedIds: readonly string[];
  onClose: () => void;
  onAdd: (courses: CourseIntroRelatedCourse[]) => void;
}>) {
  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState<Set<string>>(() => new Set(selectedIds));

  const coursesQuery = useQuery({
    queryKey: ["school-courses-picker", orgId, schoolId],
    queryFn: () => fetchSchoolWorkspaceItems(orgId, schoolId, "course"),
    staleTime: 15_000,
  });

  const items = useMemo(() => {
    const list = (coursesQuery.data?.items ?? []).filter((i) => i.id !== currentCourseId);
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter((i) => i.title.toLowerCase().includes(q));
  }, [coursesQuery.data?.items, currentCourseId, query]);

  const toggle = (id: string) => {
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const confirm = () => {
    const selected = items
      .filter((i) => picked.has(i.id))
      .map((i) => workspaceItemToRelated(i));
    // Keep previously selected that aren't in current page filter
    const byId = new Map(selected.map((c) => [c.id, c]));
    for (const id of picked) {
      if (!byId.has(id)) {
        byId.set(id, {
          id,
          title: id,
          orgLabel: "",
          rating: 4.8,
          coverUrl: "",
        });
      }
    }
    onAdd([...byId.values()]);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-primary-950/45 p-4 backdrop-blur-[2px]">
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Related Course"
        className="flex max-h-[min(90vh,44rem)] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-surface-default shadow-xl"
      >
        <div className="flex items-center justify-between border-b border-border-default px-5 py-4">
          <h3 className="text-base font-semibold text-text-primary">Related Course</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-text-tertiary hover:bg-surface-muted hover:text-text-secondary"
            aria-label="Close"
          >
            <X className="size-5" aria-hidden />
          </button>
        </div>

        <div className="px-5 pt-4">
          <div className="relative mx-auto max-w-md">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-tertiary"
              aria-hidden
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search courses…"
              className="w-full rounded-full border border-border-default bg-surface-muted/30 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-primary-500"
            />
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {coursesQuery.isPending ? (
            <p className="py-10 text-center text-sm text-text-tertiary">Loading courses…</p>
          ) : items.length === 0 ? (
            <p className="py-10 text-center text-sm text-text-tertiary">No courses found</p>
          ) : (
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((item) => {
                const checked = picked.has(item.id);
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => toggle(item.id)}
                      className={[
                        "w-full overflow-hidden rounded-xl border text-left transition-colors",
                        checked
                          ? "border-primary-600 ring-2 ring-primary-500/30"
                          : "border-border-default hover:border-primary-400",
                      ].join(" ")}
                    >
                      <div className="relative aspect-[16/10] bg-surface-muted">
                        <span
                          className={[
                            "absolute left-2 top-2 z-10 inline-flex size-4 items-center justify-center rounded border",
                            checked
                              ? "border-primary-700 bg-primary-700 text-white"
                              : "border-border-default bg-white",
                          ].join(" ")}
                          aria-hidden
                        >
                          {checked ? "✓" : null}
                        </span>
                        <div className="flex h-full flex-col items-center justify-center gap-2">
                          <Play className="size-8 text-primary-700" aria-hidden />
                          <div className="flex gap-2 text-text-tertiary">
                            <Users className="size-3.5" aria-hidden />
                          </div>
                        </div>
                      </div>
                      <div className="p-2.5">
                        <p className="line-clamp-2 text-xs font-semibold text-text-primary">
                          {item.title}
                        </p>
                        <p className="mt-1 flex items-center gap-1 text-[10px] text-text-tertiary">
                          <Star className="size-2.5 fill-amber-400 text-amber-400" aria-hidden />
                          (4.8 Reviews)
                        </p>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-border-default px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-border-default px-4 py-2 text-xs font-semibold uppercase tracking-wide text-text-secondary hover:bg-surface-muted"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={confirm}
            className="rounded-lg bg-primary-700 px-5 py-2 text-xs font-semibold uppercase tracking-wide text-white hover:bg-primary-800"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
}

function workspaceItemToRelated(item: SchoolWorkspaceItemDto): CourseIntroRelatedCourse {
  return {
    id: item.id,
    title: item.title,
    orgLabel: "",
    rating: 4.8,
    coverUrl: "",
  };
}

function ReviewsRatingPanel({ doc, canMutate, busy, onPersist }: PanelsProps) {
  const avg = averageReviewRating(doc.reviews);
  const breakdown = reviewStarBreakdown(doc.reviews);
  const [draft, setDraft] = useState("");
  const [rating, setRating] = useState(5);

  const addReview = () => {
    if (!canMutate) return;
    onPersist({
      ...doc,
      reviews: [
        {
          id: `rev_${Date.now().toString(36)}`,
          author: "You",
          rating,
          text: draft.trim(),
          createdAt: new Date().toISOString(),
        },
        ...doc.reviews,
      ],
    });
    setDraft("");
    setRating(5);
  };

  return (
    <div className="mx-auto w-full max-w-2xl space-y-8 px-2 py-4">
      <div className="flex flex-wrap items-start gap-10">
        <p className="text-6xl font-semibold tabular-nums leading-none text-text-primary sm:text-7xl">
          {avg || 0}
        </p>
        <div className="min-w-0 flex-1 space-y-3 pt-1">
          <div className="flex flex-wrap items-center gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <button
                key={i}
                type="button"
                disabled={!canMutate || busy}
                onClick={() => setRating(i + 1)}
                className="disabled:opacity-50"
                aria-label={`Rate ${i + 1} stars`}
              >
                <Star
                  className={[
                    "size-5",
                    i < rating ? "fill-amber-400 text-amber-400" : "text-border-default",
                  ].join(" ")}
                />
              </button>
            ))}
            <button
              type="button"
              disabled={!canMutate || busy}
              onClick={addReview}
              className="ml-1 text-sm font-medium text-primary-700 hover:underline disabled:opacity-40"
            >
              Rate
            </button>
            <span className="text-sm text-text-tertiary">
              {doc.reviews.length} Rating{doc.reviews.length === 1 ? "" : "s"}
            </span>
          </div>
          <ul className="max-w-md space-y-2">
            {breakdown.map((row) => (
              <li key={row.stars} className="flex items-center gap-3 text-xs text-text-secondary">
                <span className="w-12 shrink-0">{row.stars} star</span>
                <div className="h-2.5 min-w-0 flex-1 overflow-hidden rounded-sm bg-surface-muted">
                  <div
                    className="h-full rounded-sm bg-primary-700/75"
                    style={{ width: `${row.pct}%` }}
                  />
                </div>
                <span className="w-9 shrink-0 text-right text-text-tertiary">{row.pct}%</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {canMutate ? (
        <textarea
          value={draft}
          disabled={busy}
          onChange={(e) => setDraft(e.target.value)}
          rows={3}
          placeholder="Write a review… (optional)"
          className={fieldClass}
        />
      ) : null}

      {doc.reviews.length === 0 ? (
        <p className="py-14 text-center text-sm font-medium text-text-tertiary">No Reviews Yet</p>
      ) : (
        <ul className="space-y-3">
          {doc.reviews.map((r) => (
            <li key={r.id} className="rounded-xl border border-border-default px-4 py-3">
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-text-primary">{r.author}</p>
                <span className="inline-flex items-center gap-0.5 text-xs text-amber-600">
                  <Star className="size-3 fill-current" aria-hidden />
                  {r.rating}
                </span>
              </div>
              {r.text ? <p className="mt-1 text-sm text-text-secondary">{r.text}</p> : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function PrerequisitesPanel({ doc, canMutate, busy, onPersist }: PanelsProps) {
  const body = doc.prerequisites.body;

  return (
    <div className="mx-auto w-full max-w-3xl space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-base font-bold text-primary-800">Prerequisites</h3>
        <button
          type="button"
          disabled={!canMutate || busy}
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary-800 disabled:opacity-50"
          title="Link a required course (coming soon from picker)"
          onClick={() => {
            const line = "Required course: ";
            onPersist({
              ...doc,
              prerequisites: {
                ...doc.prerequisites,
                body: body ? `${body}\n${line}` : line,
              },
            });
          }}
        >
          Add Course
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border-default bg-surface-default">
        <div className="flex flex-wrap items-center gap-1 border-b border-border-default bg-surface-muted/30 px-2 py-1.5 text-text-secondary">
          <span className="rounded px-2 py-1 text-[11px] font-medium">Normal text</span>
          <span className="mx-1 h-4 w-px bg-border-default" aria-hidden />
          <List className="size-3.5 opacity-70" aria-hidden />
          <ListOrdered className="size-3.5 opacity-70" aria-hidden />
          <Bold className="size-3.5 opacity-70" aria-hidden />
          <Italic className="size-3.5 opacity-70" aria-hidden />
          <Underline className="size-3.5 opacity-70" aria-hidden />
        </div>
        <textarea
          value={body}
          disabled={!canMutate || busy}
          onChange={(e) =>
            onPersist({
              ...doc,
              prerequisites: { ...doc.prerequisites, body: e.target.value },
            })
          }
          rows={12}
          placeholder="Write your prerequisites"
          className="w-full resize-y border-0 bg-transparent px-4 py-3 text-sm text-text-primary outline-none placeholder:text-text-tertiary"
        />
      </div>
    </div>
  );
}

function CourseAnalysisPanel({ doc, canMutate, busy, onPersist }: PanelsProps) {
  const a = doc.analysis;
  const maxScore = Math.max(100, ...a.performance.map((p) => p.score), 1);
  const barColors = ["bg-red-500", "bg-orange-400", "bg-primary-800", "bg-surface-muted"];

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-3">
        <MetricCard
          title="Enrollment / Year"
          value={a.enrollmentCount}
          delta={`+${a.enrollmentDeltaPct}%`}
          deltaPositive
          iconClass="bg-amber-100 text-amber-700"
          icon={<Radio className="size-4" aria-hidden />}
          canEdit={canMutate && !busy}
          onValueChange={(n) =>
            onPersist({ ...doc, analysis: { ...a, enrollmentCount: Math.max(0, n) } })
          }
        />
        <MetricCard
          title="Completion / Year"
          value={a.completionCount}
          delta={String(a.completionDelta)}
          deltaPositive
          iconClass="bg-emerald-100 text-emerald-700"
          icon={<CheckSquare className="size-4" aria-hidden />}
          canEdit={canMutate && !busy}
          onValueChange={(n) =>
            onPersist({ ...doc, analysis: { ...a, completionCount: Math.max(0, n) } })
          }
        />
        <div className="rounded-2xl border border-border-default bg-surface-default p-4 shadow-sm">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-3xl font-semibold tabular-nums text-text-primary">
                {averageReviewRating(doc.reviews) || 0}
              </p>
              <p className="mt-1 text-xs text-text-tertiary">({doc.reviews.length} Reviews)</p>
              <div className="mt-2 flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={[
                      "size-3.5",
                      i < Math.round(averageReviewRating(doc.reviews))
                        ? "fill-amber-400 text-amber-400"
                        : "text-border-default",
                    ].join(" ")}
                  />
                ))}
              </div>
            </div>
            <span className="inline-flex size-9 items-center justify-center rounded-lg bg-primary-100 text-primary-800">
              <Star className="size-4" aria-hidden />
            </span>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border-default bg-surface-default p-4 shadow-sm sm:p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-text-primary">Course Performance</h3>
        </div>
        <div className="flex gap-3">
          <div className="flex h-44 flex-col justify-between py-1 text-[10px] text-text-tertiary">
            <span>100</span>
            <span>50</span>
            <span>0</span>
            <span className="sr-only">Score</span>
          </div>
          <div className="flex min-w-0 flex-1 items-end gap-3 sm:gap-5">
            {a.performance.map((p, i) => (
              <div key={p.name} className="flex min-w-0 flex-1 flex-col items-center gap-2">
                <div className="flex h-40 w-full items-end justify-center rounded-sm bg-surface-muted/20">
                  <div
                    className={[
                      "w-[55%] max-w-[2.5rem] rounded-t-md transition-all",
                      barColors[i % barColors.length],
                    ].join(" ")}
                    style={{ height: `${Math.max(4, (p.score / maxScore) * 100)}%` }}
                    title={`${p.name}: ${p.score}`}
                  />
                </div>
                {canMutate ? (
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={p.score}
                    disabled={busy}
                    onChange={(e) => {
                      const score = Number(e.target.value);
                      onPersist({
                        ...doc,
                        analysis: {
                          ...a,
                          performance: a.performance.map((row, idx) =>
                            idx === i ? { ...row, score } : row,
                          ),
                        },
                      });
                    }}
                    className="w-14 rounded border border-border-default px-1 py-0.5 text-center text-[10px]"
                    aria-label={`${p.name} score`}
                  />
                ) : null}
                <span className="text-[11px] font-medium text-text-secondary">{p.name}</span>
              </div>
            ))}
          </div>
        </div>
        <p className="mt-2 text-center text-[10px] text-text-tertiary">Score</p>
      </div>
    </div>
  );
}

function MetricCard({
  title,
  value,
  delta,
  deltaPositive,
  iconClass,
  icon,
  canEdit,
  onValueChange,
}: Readonly<{
  title: string;
  value: number;
  delta: string;
  deltaPositive?: boolean;
  iconClass: string;
  icon: ReactNode;
  canEdit?: boolean;
  onValueChange?: (n: number) => void;
}>) {
  return (
    <div className="rounded-2xl border border-border-default bg-surface-default p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div>
          {canEdit && onValueChange ? (
            <input
              type="number"
              min={0}
              value={value}
              onChange={(e) => onValueChange(Number(e.target.value))}
              className="w-24 border-0 bg-transparent p-0 text-3xl font-semibold tabular-nums text-text-primary outline-none"
              aria-label={title}
            />
          ) : (
            <p className="text-3xl font-semibold tabular-nums text-text-primary">{value}</p>
          )}
          <p className="mt-1 text-xs text-text-secondary">{title}</p>
          <p
            className={[
              "mt-2 text-xs font-semibold",
              deltaPositive ? "text-emerald-600" : "text-red-600",
            ].join(" ")}
          >
            {delta}
          </p>
        </div>
        <span
          className={["inline-flex size-9 items-center justify-center rounded-lg", iconClass].join(
            " ",
          )}
        >
          {icon}
        </span>
      </div>
    </div>
  );
}
