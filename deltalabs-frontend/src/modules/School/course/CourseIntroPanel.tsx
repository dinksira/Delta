"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Film,
  FolderOpen,
  Plus,
  Reply,
  Share2,
  ThumbsDown,
  ThumbsUp,
  Upload,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { ApiError } from "@/lib/apiClient";
import {
  fetchOrgMedia,
  updateSchoolWorkspaceItem,
  uploadSchoolMediaFile,
  type SchoolWorkspaceItemDto,
} from "@/modules/School/api";
import {
  COURSE_INTRO_SUB_TABS,
  courseIntroToJson,
  parseCourseIntroFromMetadata,
  type CourseIntroComment,
  type CourseIntroDoc,
  type CourseIntroSubTabId,
  type CourseIntroVideo,
} from "@/modules/School/course/courseIntroTypes";
import { CourseIntroFigmaSubTabs } from "@/modules/School/course/CourseIntroFigmaSubTabs";
import { CourseIntroManagementTableView } from "@/modules/School/course/CourseIntroManagementTableView";
import { schoolQueryKeys } from "@/modules/School/hooks/schoolQueryKeys";

type ViewMode = "direct" | "table";

function newId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function activeVideo(doc: CourseIntroDoc): CourseIntroVideo | null {
  if (!doc.videos.length) return null;
  const byId = doc.activeVideoId
    ? doc.videos.find((v) => v.id === doc.activeVideoId)
    : undefined;
  return byId ?? doc.videos[0] ?? null;
}

function mediaAssetIdFromRef(mediaRef: string): string | null {
  const raw = mediaRef.trim();
  if (!raw) return null;
  if (raw.startsWith("media://")) return raw.slice("media://".length).trim() || null;
  if (/^[0-9a-f-]{36}$/i.test(raw)) return raw;
  return null;
}

function emptyVideoSlot(partial?: Partial<CourseIntroVideo>): CourseIntroVideo {
  const now = new Date().toISOString();
  return {
    id: newId("vid"),
    mediaId: "",
    playbackUrl: "",
    title: "Intro video",
    label: "",
    description: "",
    keyframeTime: "00:00",
    tags: [],
    status: "draft",
    publishToFeed: false,
    createdAt: now,
    updatedAt: now,
    ...partial,
  };
}

const fieldClass =
  "w-full rounded-lg border border-border-default bg-surface-default px-3 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary outline-none transition-colors focus:border-primary-500";

export function CourseIntroPanel({
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("direct");
  const [subTab, setSubTab] = useState<CourseIntroSubTabId>("intro");
  const [doc, setDoc] = useState<CourseIntroDoc>(() =>
    parseCourseIntroFromMetadata(courseItem.metadata ?? undefined),
  );
  const [error, setError] = useState<string | null>(null);
  const [descriptionDraft, setDescriptionDraft] = useState("");
  const [commentDraft, setCommentDraft] = useState("");
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [replyOpenId, setReplyOpenId] = useState<string | null>(null);
  const [resolvingPlayback, setResolvingPlayback] = useState(false);

  useEffect(() => {
    setDoc(parseCourseIntroFromMetadata(courseItem.metadata ?? undefined));
  }, [courseItem.id, courseItem.updatedAt, courseItem.metadata]);

  const video = useMemo(() => activeVideo(doc), [doc]);

  useEffect(() => {
    setDescriptionDraft(video?.description ?? "");
  }, [video?.id, video?.description]);

  // Resolve media:// refs → playable HTTP URL for already-uploaded intros.
  useEffect(() => {
    if (!video?.mediaId || video.playbackUrl) return;
    const assetId = mediaAssetIdFromRef(video.mediaId);
    if (!assetId) return;
    const videoId = video.id;
    let cancelled = false;
    setResolvingPlayback(true);
    void (async () => {
      try {
        const asset = await fetchOrgMedia(orgId, assetId);
        const url = asset.playbackUrl || asset.playback_url || asset.hlsUrl || asset.hls_url || "";
        if (!url || cancelled) return;
        setDoc((prev) => {
          const nextVideos = prev.videos.map((v) =>
            v.id === videoId ? { ...v, playbackUrl: url } : v,
          );
          const next = { ...prev, videos: nextVideos };
          void updateSchoolWorkspaceItem(orgId, schoolId, courseItem.id, {
            metadata: { ...(courseItem.metadata ?? {}), courseIntro: courseIntroToJson(next) },
          }).then(() => {
            void queryClient.invalidateQueries({
              queryKey: schoolQueryKeys.workspaceItem(orgId, schoolId, courseItem.id),
            });
          });
          return next;
        });
      } catch {
        /* keep filename-only UI */
      } finally {
        if (!cancelled) setResolvingPlayback(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [
    video?.id,
    video?.mediaId,
    video?.playbackUrl,
    orgId,
    schoolId,
    courseItem.id,
    courseItem.metadata,
    queryClient,
  ]);

  const saveMutation = useMutation({
    mutationFn: async (next: CourseIntroDoc) => {
      const metadata = { ...(courseItem.metadata ?? {}), courseIntro: courseIntroToJson(next) };
      return updateSchoolWorkspaceItem(orgId, schoolId, courseItem.id, { metadata });
    },
    onSuccess: () => {
      setError(null);
      void queryClient.invalidateQueries({
        queryKey: schoolQueryKeys.workspaceItem(orgId, schoolId, courseItem.id),
      });
    },
    onError: (e) => {
      if (e instanceof ApiError) setError(e.message);
      else if (e instanceof Error) setError(e.message);
      else setError("Could not save course intro.");
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async (payload: Readonly<{ file: File; mode: "replace" | "add" }>) => {
      const { file, mode } = payload;
      let working = doc;
      let current = activeVideo(working);
      if (mode === "add" || !current) {
        const created = emptyVideoSlot({
          title: `Intro video ${working.videos.length + 1}`,
        });
        working = {
          ...working,
          videos: [...working.videos, created],
          activeVideoId: created.id,
        };
        current = created;
      }
      const uploaded = await uploadSchoolMediaFile(orgId, file, {
        caption: current.title.trim() || "Course intro video",
        visibility: current.publishToFeed ? "public" : "org",
        publishToFeed: current.publishToFeed,
      });
      const now = new Date().toISOString();
      const next: CourseIntroDoc = {
        ...working,
        videos: working.videos.map((v) =>
          v.id === current!.id
            ? {
                ...v,
                mediaId: uploaded.referenceUrl,
                playbackUrl: uploaded.playbackUrl,
                label: file.name,
                description: descriptionDraft,
                updatedAt: now,
              }
            : v,
        ),
        activeVideoId: current.id,
      };
      setDoc(next);
      await saveMutation.mutateAsync(next);
    },
    onError: (e) => {
      if (e instanceof ApiError) setError(e.message);
      else if (e instanceof Error) setError(e.message);
      else setError("Could not upload intro video.");
    },
  });

  const persist = (next: CourseIntroDoc) => {
    setDoc(next);
    if (!canMutate) return;
    saveMutation.mutate(next);
  };

  const ensureVideo = (): CourseIntroVideo => {
    const existing = activeVideo(doc);
    if (existing) return existing;
    const created = emptyVideoSlot();
    const next = { ...doc, videos: [...doc.videos, created], activeVideoId: created.id };
    persist(next);
    return created;
  };

  const selectVideo = (id: string) => {
    if (doc.activeVideoId === id) return;
    persist({ ...doc, activeVideoId: id });
  };

  const uploadModeRef = useRef<"replace" | "add">("replace");

  const openFilePicker = (mode: "replace" | "add") => {
    uploadModeRef.current = mode;
    fileInputRef.current?.click();
  };

  const updateActiveVideo = (patch: Partial<CourseIntroVideo>) => {
    const current = video ?? ensureVideo();
    const now = new Date().toISOString();
    const baseVideos = video ? doc.videos : [...doc.videos, current];
    persist({
      ...doc,
      videos: baseVideos.map((v) =>
        v.id === current.id ? { ...v, ...patch, updatedAt: now } : v,
      ),
      activeVideoId: current.id,
    });
  };

  const saveDescription = () => {
    if (!canMutate || !video) return;
    if (descriptionDraft === video.description) return;
    updateActiveVideo({ description: descriptionDraft });
  };

  const toggleLike = (comment: CourseIntroComment) => {
    const liked = !comment.likedByMe;
    let likes = comment.likes;
    let dislikes = comment.dislikes;
    let dislikedByMe = comment.dislikedByMe;
    if (liked) {
      likes += 1;
      if (dislikedByMe) {
        dislikes = Math.max(0, dislikes - 1);
        dislikedByMe = false;
      }
    } else {
      likes = Math.max(0, likes - 1);
    }
    persist({
      ...doc,
      comments: doc.comments.map((c) =>
        c.id === comment.id
          ? { ...c, likes, dislikes, likedByMe: liked, dislikedByMe }
          : c,
      ),
    });
  };

  const toggleDislike = (comment: CourseIntroComment) => {
    const disliked = !comment.dislikedByMe;
    let likes = comment.likes;
    let dislikes = comment.dislikes;
    let likedByMe = comment.likedByMe;
    if (disliked) {
      dislikes += 1;
      if (likedByMe) {
        likes = Math.max(0, likes - 1);
        likedByMe = false;
      }
    } else {
      dislikes = Math.max(0, dislikes - 1);
    }
    persist({
      ...doc,
      comments: doc.comments.map((c) =>
        c.id === comment.id
          ? { ...c, likes, dislikes, likedByMe, dislikedByMe: disliked }
          : c,
      ),
    });
  };

  const busy = saveMutation.isPending || uploadMutation.isPending;
  const hasMedia = Boolean(video?.mediaId);
  const playbackSrc = video?.playbackUrl?.trim() || "";

  return (
    <div className="space-y-5" aria-label="Course Intro">
      {/* Direct View / Management Table — Figma toggle */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-0">
          <button
            type="button"
            onClick={() => setViewMode("direct")}
            className={[
              "rounded-lg px-4 py-2 text-sm font-semibold transition-colors",
              viewMode === "direct"
                ? "bg-surface-muted text-primary-800"
                : "text-text-secondary hover:bg-surface-muted/60 hover:text-text-primary",
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
                : "text-text-secondary hover:bg-surface-muted/60 hover:text-text-primary",
            ].join(" ")}
          >
            Management Table
          </button>
        </div>
      </div>

      {/* Intro sub-tabs — Direct View only (Figma hides these in Management Table) */}
      {viewMode === "direct" ? (
        <div className="flex items-end gap-1 overflow-x-auto border-b border-border-default [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {COURSE_INTRO_SUB_TABS.map((tab) => {
            const active = tab.id === subTab;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSubTab(tab.id)}
                className={[
                  "relative shrink-0 px-2.5 pb-2.5 pt-1 text-[13px] transition-colors sm:px-3",
                  active
                    ? "font-bold text-primary-800"
                    : "font-medium text-text-secondary hover:text-text-primary",
                ].join(" ")}
              >
                {tab.label}
                <span
                  className={[
                    "absolute inset-x-2 bottom-0 h-0.5 rounded-full",
                    active ? "bg-primary-600" : "bg-transparent",
                  ].join(" ")}
                  aria-hidden
                />
              </button>
            );
          })}
          <button
            type="button"
            className="mb-2 ml-1 inline-flex size-7 shrink-0 items-center justify-center rounded-md text-text-tertiary transition-colors hover:bg-surface-muted hover:text-text-secondary"
            aria-label="Add tab"
            title="Add tab"
          >
            <Plus className="size-4" aria-hidden />
          </button>
        </div>
      ) : null}

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      {viewMode === "table" ? (
        <CourseIntroManagementTableView
          orgId={orgId}
          schoolId={schoolId}
          courseItem={courseItem}
          canMutate={canMutate}
        />
      ) : subTab === "intro" ? (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:items-start">
          {/* Left — main player + thumbnail strip */}
          <div className="space-y-3">
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                if (file) {
                  uploadMutation.mutate({ file, mode: uploadModeRef.current });
                }
              }}
            />

            {playbackSrc ? (
              <div className="overflow-hidden rounded-xl border border-border-default bg-black shadow-sm">
                <div className="relative aspect-video w-full bg-black">
                  <video
                    key={playbackSrc}
                    src={playbackSrc}
                    controls
                    playsInline
                    preload="metadata"
                    className="h-full w-full object-contain"
                    aria-label={video?.label || video?.title || "Course intro video"}
                  >
                    Your browser does not support video playback.
                  </video>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/10 bg-primary-900/95 px-3 py-2.5">
                  <p className="min-w-0 truncate text-xs text-white/85">
                    {video?.label || video?.title || "Intro video"}
                  </p>
                  <button
                    type="button"
                    disabled={!canMutate || busy}
                    onClick={() => openFilePicker("replace")}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-md bg-white/10 px-2.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-white/20 disabled:opacity-50"
                  >
                    <Upload className="size-3.5" aria-hidden />
                    Replace video
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex min-h-[22rem] flex-col items-center justify-center rounded-xl border border-dashed border-border-default bg-surface-muted/15 px-6 py-10 text-center sm:min-h-[26rem]">
                <FolderOpen className="size-14 text-primary-700/80 sm:size-16" strokeWidth={1.25} aria-hidden />
                <p className="mt-4 max-w-xs text-sm text-text-secondary">
                  {hasMedia
                    ? resolvingPlayback
                      ? "Preparing video player…"
                      : video?.label || "Intro video uploaded — resolving playback…"
                    : "You can upload course intro video here."}
                </p>
                {hasMedia && !resolvingPlayback ? (
                  <p className="mt-1 max-w-full truncate font-mono text-[10px] text-text-tertiary">
                    {video?.mediaId}
                  </p>
                ) : null}
                <button
                  type="button"
                  disabled={!canMutate || busy}
                  onClick={() => openFilePicker(doc.videos.length ? "replace" : "add")}
                  className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary-700 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Upload className="size-4" aria-hidden />
                  {uploadMutation.isPending
                    ? "Uploading…"
                    : hasMedia
                      ? "Replace video"
                      : "Upload your course intro video"}
                </button>
              </div>
            )}

            {/* Thumbnail strip: clips + add (+) on the right */}
            <div
              className="flex flex-wrap items-center gap-2"
              role="list"
              aria-label="Intro video clips"
            >
              {doc.videos.map((clip, index) => {
                const isActive = video?.id === clip.id;
                const thumbSrc = clip.playbackUrl.trim();
                return (
                  <button
                    key={clip.id}
                    type="button"
                    role="listitem"
                    onClick={() => selectVideo(clip.id)}
                    title={clip.label || clip.title || `Intro ${index + 1}`}
                    aria-label={`Show ${clip.label || clip.title || `intro video ${index + 1}`}`}
                    aria-current={isActive ? "true" : undefined}
                    className={[
                      "relative inline-flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-surface-default transition-colors",
                      isActive
                        ? "border-primary-600 ring-2 ring-primary-500/40"
                        : "border-border-default hover:bg-surface-muted",
                    ].join(" ")}
                  >
                    {thumbSrc ? (
                      <video
                        src={thumbSrc}
                        muted
                        playsInline
                        preload="metadata"
                        className="h-full w-full object-cover"
                        aria-hidden
                      />
                    ) : (
                      <Film className="size-5 text-text-tertiary" aria-hidden />
                    )}
                    <span className="absolute bottom-0.5 right-0.5 rounded bg-black/65 px-1 text-[9px] font-semibold text-white">
                      {index + 1}
                    </span>
                  </button>
                );
              })}
              <button
                type="button"
                disabled={!canMutate || busy}
                onClick={() => openFilePicker("add")}
                className="inline-flex size-14 shrink-0 items-center justify-center rounded-lg border border-border-default bg-surface-default text-text-tertiary transition-colors hover:bg-surface-muted hover:text-text-secondary disabled:opacity-50"
                aria-label="Add another intro video"
                title="Add another intro video"
              >
                <span className="inline-flex size-8 items-center justify-center rounded-full border border-border-default">
                  <Plus className="size-4" aria-hidden />
                </span>
              </button>
            </div>
          </div>

          {/* Right — description + comments */}
          <div className="space-y-4">
            <textarea
              value={descriptionDraft}
              disabled={!canMutate || busy}
              onChange={(e) => setDescriptionDraft(e.target.value)}
              onBlur={saveDescription}
              rows={4}
              placeholder="Describe your video here..."
              className={[fieldClass, "resize-y min-h-[6rem]"].join(" ")}
            />

            <div>
              <h3 className="text-base font-extrabold text-text-primary">Comments</h3>
              <ul className="mt-3 max-h-[16rem] space-y-4 overflow-y-auto pr-1">
                {doc.comments.length === 0 ? (
                  <li className="py-4 text-sm text-text-tertiary">No comments yet.</li>
                ) : (
                  doc.comments.map((c) => (
                    <li key={c.id} className="flex gap-3">
                      <span
                        className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-primary-100 text-sm font-bold text-primary-800"
                        aria-hidden
                      >
                        {c.author.trim().charAt(0).toUpperCase() || "?"}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-text-primary">{c.author}</p>
                        <p className="mt-0.5 text-sm leading-snug text-text-secondary">{c.text}</p>
                        <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-text-tertiary">
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => toggleLike(c)}
                            className={[
                              "inline-flex items-center gap-1 hover:text-text-secondary",
                              c.likedByMe ? "text-primary-700" : "",
                            ].join(" ")}
                          >
                            <ThumbsUp className="size-3.5" aria-hidden />
                            {c.likes}
                          </button>
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => toggleDislike(c)}
                            className={[
                              "inline-flex items-center gap-1 hover:text-text-secondary",
                              c.dislikedByMe ? "text-primary-700" : "",
                            ].join(" ")}
                          >
                            <ThumbsDown className="size-3.5" aria-hidden />
                            {c.dislikes}
                          </button>
                          <span className="inline-flex items-center gap-1">
                            <Share2 className="size-3.5" aria-hidden />
                            0
                          </span>
                          <button
                            type="button"
                            onClick={() => setReplyOpenId(replyOpenId === c.id ? null : c.id)}
                            className="inline-flex items-center gap-1 hover:text-text-secondary"
                          >
                            <Reply className="size-3.5" aria-hidden />
                            Reply
                          </button>
                        </div>
                        {c.replies.length > 0 ? (
                          <ul className="mt-2 space-y-2 border-l border-border-default pl-3">
                            {c.replies.map((r) => (
                              <li key={r.id}>
                                <p className="text-xs font-semibold text-text-primary">{r.author}</p>
                                <p className="text-xs text-text-secondary">{r.text}</p>
                              </li>
                            ))}
                          </ul>
                        ) : null}
                        {replyOpenId === c.id ? (
                          <div className="mt-2 flex gap-2">
                            <input
                              value={replyDrafts[c.id] ?? ""}
                              disabled={!canMutate || busy}
                              onChange={(e) =>
                                setReplyDrafts((prev) => ({ ...prev, [c.id]: e.target.value }))
                              }
                              placeholder="Write a reply..."
                              className={fieldClass}
                            />
                            <button
                              type="button"
                              disabled={!canMutate || busy || !(replyDrafts[c.id] ?? "").trim()}
                              onClick={() => {
                                const text = (replyDrafts[c.id] ?? "").trim();
                                if (!text) return;
                                persist({
                                  ...doc,
                                  comments: doc.comments.map((row) =>
                                    row.id === c.id
                                      ? {
                                          ...row,
                                          replies: [
                                            ...row.replies,
                                            {
                                              id: newId("rpl"),
                                              author: "You",
                                              text,
                                              createdAt: new Date().toISOString(),
                                            },
                                          ],
                                        }
                                      : row,
                                  ),
                                });
                                setReplyDrafts((prev) => ({ ...prev, [c.id]: "" }));
                                setReplyOpenId(null);
                              }}
                              className="shrink-0 rounded-lg border border-border-default px-3 text-xs font-semibold text-text-secondary hover:bg-surface-muted"
                            >
                              Post
                            </button>
                          </div>
                        ) : null}
                      </div>
                    </li>
                  ))
                )}
              </ul>

              <div className="mt-3 flex gap-2">
                <input
                  value={commentDraft}
                  disabled={!canMutate || busy}
                  onChange={(e) => setCommentDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key !== "Enter") return;
                    e.preventDefault();
                    const text = commentDraft.trim();
                    if (!text || !canMutate) return;
                    persist({
                      ...doc,
                      comments: [
                        {
                          id: newId("cmt"),
                          author: "You",
                          authorUserId: "",
                          text,
                          createdAt: new Date().toISOString(),
                          likes: 0,
                          dislikes: 0,
                          likedByMe: false,
                          dislikedByMe: false,
                          replies: [],
                        },
                        ...doc.comments,
                      ],
                    });
                    setCommentDraft("");
                  }}
                  placeholder="Write your comment here..."
                  className={fieldClass}
                />
              </div>
            </div>
          </div>
        </div>
      ) : (
        <CourseIntroFigmaSubTabs
          subTab={subTab}
          doc={doc}
          orgId={orgId}
          schoolId={schoolId}
          courseTitle={courseItem.title}
          currentCourseId={courseItem.id}
          canMutate={canMutate}
          busy={busy}
          onPersist={persist}
        />
      )}

      {busy ? (
        <p className="text-xs text-text-tertiary" role="status">
          Saving…
        </p>
      ) : null}
    </div>
  );
}
