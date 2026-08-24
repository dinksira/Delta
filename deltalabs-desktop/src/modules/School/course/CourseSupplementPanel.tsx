"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Bookmark,
  Download,
  FileSearch,
  FileText,
  Ghost,
} from "lucide-react";
import { useMemo, useState } from "react";

import { Button, SearchInput } from "@/components/theme";
import { ApiError } from "@/lib/apiClient";
import {
  createCourseSupplement,
  deleteCourseSupplement,
  fetchCourseSupplements,
  type CourseSupplementDto,
  type CourseSupplementKind,
  type SchoolWorkspaceItemDto,
} from "@/modules/School/api";
import { CourseExerciseManagementTableView } from "@/modules/School/course/CourseExerciseManagementTableView";
import { SupplementPreviewDialog } from "@/modules/School/course/supplement/SupplementPreviewDialog";
import {
  UploadSupplementModal,
  type UploadSupplementPayload,
} from "@/modules/School/course/supplement/UploadSupplementModal";
import { GhostDrawer } from "@/modules/School/ghost";
import { schoolQueryKeys } from "@/modules/School/hooks/schoolQueryKeys";

type ViewMode = "direct" | "table";
type KindTab = CourseSupplementKind | "ghost";

const KIND_TABS: ReadonlyArray<{ id: KindTab; label: string }> = [
  { id: "pdf", label: "PDF Documents" },
  { id: "slides", label: "Slide Documents" },
  { id: "video", label: "Video Lectures" },
  { id: "audio", label: "Audio" },
  { id: "other", label: "Other" },
  { id: "ghost", label: "Ghost file" },
];

function kindBadge(kind: CourseSupplementKind): string {
  if (kind === "pdf") return "PDF";
  if (kind === "slides") return "SLIDES";
  if (kind === "video") return "VIDEO";
  if (kind === "audio") return "AUDIO";
  return "FILE";
}

export function CourseSupplementPanel({
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
  const [kindTab, setKindTab] = useState<KindTab>("pdf");
  const [search, setSearch] = useState("");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [preview, setPreview] = useState<CourseSupplementDto | null>(null);
  const [ghostOpen, setGhostOpen] = useState(false);
  const [ghostId, setGhostId] = useState<string | null>(null);

  const ghostsOnly = kindTab === "ghost";
  const kindFilter = ghostsOnly ? undefined : kindTab;

  const listQuery = useQuery({
    queryKey: schoolQueryKeys.courseSupplements(
      orgId,
      schoolId,
      courseItem.id,
      kindTab,
      ghostsOnly,
    ),
    queryFn: () =>
      fetchCourseSupplements(orgId, schoolId, courseItem.id, {
        kind: kindFilter,
        ghostsOnly,
      }),
    enabled: viewMode === "direct",
    staleTime: 0,
    refetchOnMount: "always",
  });

  const createMutation = useMutation({
    mutationFn: (payload: UploadSupplementPayload) =>
      createCourseSupplement(orgId, schoolId, courseItem.id, {
        title: payload.title,
        description: payload.description,
        source: payload.source,
        kind: payload.kind,
        mediaId: payload.mediaId,
        playbackUrl: payload.playbackUrl,
        linkUrl: payload.linkUrl,
        contentType: payload.contentType,
        fileName: payload.fileName,
        status: "published",
      }),
    onSuccess: async (created) => {
      setUploadOpen(false);
      setUploadError(null);
      if (created.kind) setKindTab(created.kind);
      await queryClient.invalidateQueries({
        queryKey: ["school", "course-supplements", orgId, schoolId, courseItem.id],
      });
    },
    onError: (err) => {
      setUploadError(err instanceof ApiError ? err.message : "Could not upload supplement.");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteCourseSupplement(orgId, schoolId, courseItem.id, id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["school", "course-supplements", orgId, schoolId, courseItem.id],
      });
    },
  });

  const items = useMemo(() => {
    const all = listQuery.data?.items ?? [];
    const q = search.trim().toLowerCase();
    if (!q) return all;
    return all.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.tags.some((t) => t.toLowerCase().includes(q)),
    );
  }, [listQuery.data?.items, search]);

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
        slotKey: "course.supplement.resource",
        resourceKind: "document",
        defaultNodeName: "Supplement resource",
      }}
      onClose={() => setGhostOpen(false)}
      onGhostCreated={(g) => setGhostId(g.id)}
    />
  );

  if (viewMode === "table") {
    return (
      <div className="space-y-5" aria-label="Supplement management table">
        <ViewToggle viewMode={viewMode} setViewMode={setViewMode} />
        <CourseExerciseManagementTableView
          orgId={orgId}
          schoolId={schoolId}
          courseItem={courseItem}
          canMutate={canMutate}
          surface="supplement"
        />
        {ghostDrawer}
      </div>
    );
  }

  return (
    <div className="space-y-5" aria-label="Course Supplements">
      <ViewToggle viewMode={viewMode} setViewMode={setViewMode} />

      <div className="grid grid-cols-1 items-end gap-3 lg:grid-cols-[1fr_auto_1fr]">
        <div className="flex min-w-0 flex-wrap items-end gap-4 lg:justify-self-start">
          {KIND_TABS.map((tab) => {
            const active = kindTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setKindTab(tab.id)}
                className={[
                  "relative pb-2.5 text-sm transition-colors",
                  active
                    ? "font-bold text-[#0f2a3d]"
                    : "font-medium text-[#8a9aab] hover:text-text-primary",
                ].join(" ")}
              >
                {tab.label}
                {active ? (
                  <span className="absolute inset-x-0 bottom-0 h-[3px] rounded-full bg-[#0f2a3d]" />
                ) : null}
              </button>
            );
          })}
        </div>
        <div className="w-full max-w-sm justify-self-center lg:w-[18rem]">
          <SearchInput
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search..."
            aria-label="Search supplements"
            className="h-9 shadow-none"
            inputClassName="py-1 text-xs"
          />
        </div>
        <div className="flex justify-self-end lg:justify-self-end">
          <Button
            type="button"
            variant="primary"
            size="sm"
            disabled={!canMutate}
            onClick={() => {
              setUploadError(null);
              setUploadOpen(true);
            }}
          >
            Upload Supplement
          </Button>
        </div>
      </div>

      {listQuery.isPending ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <div className="h-64 animate-pulse rounded-2xl bg-surface-muted/50" />
          <div className="h-64 animate-pulse rounded-2xl bg-surface-muted/50" />
        </div>
      ) : listQuery.isError ? (
        <p className="text-sm text-red-600">
          {listQuery.error instanceof ApiError
            ? listQuery.error.message
            : "Could not load supplements."}
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {kindTab === "ghost" ? (
            <button
              type="button"
              disabled={!canMutate}
              onClick={() => {
                setGhostId(null);
                setGhostOpen(true);
              }}
              className="flex min-h-[16rem] flex-col items-center justify-center rounded-2xl bg-[#e8eef2] px-6 py-10 text-center transition-colors hover:bg-[#dfe7ed] disabled:opacity-60"
            >
              <p className="text-sm font-medium text-[#5a6b7a]">Open ghost workspace</p>
              <Ghost className="mt-4 size-10 text-primary-800" strokeWidth={1.4} aria-hidden />
            </button>
          ) : null}

          {items.length === 0 && kindTab !== "ghost" ? (
            <div className="col-span-full flex min-h-[22rem] flex-col items-center justify-center rounded-2xl bg-[#f4f7f9] px-6 py-12 text-center">
              <FileSearch className="size-16 text-[#9aafbe]" strokeWidth={1.2} aria-hidden />
              <p className="mt-4 text-base font-semibold text-[#0f2a3d]">No Resource Detected</p>
              <p className="mt-1 text-sm text-[#8a9aab]">Upload Resource</p>
              <Button
                type="button"
                variant="primary"
                size="md"
                className="mt-5"
                disabled={!canMutate}
                onClick={() => {
                  setUploadError(null);
                  setUploadOpen(true);
                }}
              >
                Upload Supplement
              </Button>
            </div>
          ) : null}

          {items.map((item) => (
            <SupplementCard
              key={item.id}
              item={item}
              canMutate={canMutate}
              onPreview={() => setPreview(item)}
              onOpenGhost={
                item.ghostId
                  ? () => {
                      setGhostId(item.ghostId!);
                      setGhostOpen(true);
                    }
                  : undefined
              }
              onDelete={() => deleteMutation.mutate(item.id)}
            />
          ))}
        </div>
      )}

      <UploadSupplementModal
        open={uploadOpen}
        orgId={orgId}
        busy={createMutation.isPending}
        error={uploadError}
        onClose={() => !createMutation.isPending && setUploadOpen(false)}
        onUpload={(payload) => createMutation.mutate(payload)}
      />

      {preview ? (
        <SupplementPreviewDialog
          open
          orgId={orgId}
          title={preview.title}
          kind={preview.kind}
          mediaId={preview.mediaId}
          playbackUrl={preview.playbackUrl}
          linkUrl={preview.linkUrl}
          fileName={preview.fileName}
          contentType={preview.contentType}
          onClose={() => setPreview(null)}
        />
      ) : null}

      {ghostDrawer}
    </div>
  );
}

function SupplementCard({
  item,
  canMutate,
  onPreview,
  onOpenGhost,
  onDelete,
}: Readonly<{
  item: CourseSupplementDto;
  canMutate: boolean;
  onPreview: () => void;
  onOpenGhost?: () => void;
  onDelete: () => void;
}>) {
  const creator =
    item.createdBy.fullName?.trim() || item.createdBy.username || "Someone";
  const initials = creator.slice(0, 2).toUpperCase();
  const isVideo = item.kind === "video";
  const isAudio = item.kind === "audio";
  const thumb = item.playbackUrl?.trim() || "";

  return (
    <article className="overflow-hidden rounded-2xl border border-border-default bg-white shadow-[0_1px_3px_rgba(15,40,60,0.06)]">
      <button type="button" className="relative block w-full text-left" onClick={onPreview}>
        <div className="relative aspect-[4/3] bg-[#eef2f5]">
          <span className="absolute left-2 top-2 z-[1] rounded bg-[#0f2a3d]/80 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
            {kindBadge(item.kind)}
          </span>
          {isVideo && thumb ? (
            <video src={thumb} className="h-full w-full object-cover" muted playsInline preload="metadata" />
          ) : isAudio ? (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-primary-800">
              <FileText className="size-12" strokeWidth={1.3} aria-hidden />
              <span className="text-xs font-medium text-[#5a6b7a]">Audio</span>
            </div>
          ) : thumb && item.kind === "pdf" ? (
            <iframe title="" src={thumb} className="pointer-events-none h-full w-full border-0" />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-[#9aafbe]">
              <FileText className="size-12" strokeWidth={1.3} aria-hidden />
              <span className="text-xs">{kindBadge(item.kind)}</span>
            </div>
          )}
        </div>
      </button>
      <div className="space-y-2 p-3">
        <h3 className="line-clamp-2 text-sm font-bold text-[#0f2a3d]">{item.title}</h3>
        {item.tags.length > 0 ? (
          <p className="line-clamp-2 text-[11px] text-[#5a6b7a]">
            {item.tags.map((t) => `#${t}`).join(" ")}
          </p>
        ) : item.description ? (
          <p className="line-clamp-2 text-xs text-[#5a6b7a]">{item.description}</p>
        ) : null}
        <div className="flex items-center justify-between gap-2 pt-1">
          <div className="flex min-w-0 items-center gap-2">
            <span className="inline-flex size-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface-muted text-[10px] font-semibold text-text-secondary">
              {item.createdBy.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.createdBy.avatarUrl} alt="" className="size-full object-cover" />
              ) : (
                initials
              )}
            </span>
            <span className="truncate text-[11px] text-[#8a9aab]">{creator}</span>
          </div>
          <div className="flex items-center gap-1">
            {onOpenGhost ? (
              <button
                type="button"
                title="Open ghost"
                className="rounded p-1.5 text-primary-800 hover:bg-[#e8eef2]"
                onClick={onOpenGhost}
              >
                <Ghost className="size-3.5" aria-hidden />
              </button>
            ) : null}
            <button
              type="button"
              title="Preview"
              className="rounded p-1.5 text-[#5a6b7a] hover:bg-[#e8eef2]"
              onClick={onPreview}
            >
              <Bookmark className="size-3.5" aria-hidden />
            </button>
            {item.playbackUrl || item.linkUrl ? (
              <a
                href={item.playbackUrl || item.linkUrl}
                download={item.fileName || undefined}
                target="_blank"
                rel="noreferrer"
                title="Download / open"
                className="rounded p-1.5 text-[#5a6b7a] hover:bg-[#e8eef2]"
                onClick={(e) => e.stopPropagation()}
              >
                <Download className="size-3.5" aria-hidden />
              </a>
            ) : null}
            {canMutate ? (
              <button
                type="button"
                title="Delete"
                className="rounded px-1.5 py-1 text-[10px] font-semibold text-red-600 hover:bg-red-50"
                onClick={onDelete}
              >
                Del
              </button>
            ) : null}
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
