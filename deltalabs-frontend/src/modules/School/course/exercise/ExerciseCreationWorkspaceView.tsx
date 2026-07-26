"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { ApiError } from "@/lib/apiClient";
import { useAuthSession } from "@/contexts/AuthSession_Context";
import {
  createCourseExercise,
  deleteCourseExercise,
  fetchCourseExercise,
  fetchOrgAccess,
  fetchSchoolGhost,
  updateCourseExercise,
  type ExerciseQuestionDto,
} from "@/modules/School/api";
import { userCanManageSchoolWorkspace } from "@/modules/School/class/schoolClassPermissions";
import { CLASS_WORKSPACE_LAYOUT } from "@/modules/School/class/layoutConstants";
import { createEmptyQuestion } from "@/modules/School/course/exercise/exerciseModel";
import { ExerciseQuestionCanvas } from "@/modules/School/course/exercise/ExerciseQuestionCanvas";
import { ExerciseWorkspaceHeader } from "@/modules/School/course/exercise/ExerciseWorkspaceHeader";
import {
  ExerciseWorkspaceSidebar,
  type ExerciseSidebarResource,
  type ExerciseSidebarState,
} from "@/modules/School/course/exercise/ExerciseWorkspaceSidebar";
import { schoolQueryKeys } from "@/modules/School/hooks/schoolQueryKeys";
import { useSchoolActiveOrgId } from "@/modules/School/hooks/useSchoolActiveOrgId";

/** Old create/publish path forced this Unsplash stock cover — treat as “no cover”. */
const LEGACY_STOCK_COVER = "photo-1636466497217-26a8cbeaf0aa";

function normalizeCoverUrl(url: string | null | undefined): string {
  const trimmed = (url ?? "").trim();
  if (!trimmed) return "";
  if (trimmed.includes(LEGACY_STOCK_COVER)) return "";
  if (trimmed.startsWith("media://")) return "";
  return trimmed;
}

export function ExerciseCreationWorkspaceView({
  schoolId,
  courseItemId,
  exerciseId,
  kind = "exercise",
}: Readonly<{
  schoolId: string;
  courseItemId: string;
  exerciseId?: string | null;
  kind?: "exercise" | "test";
}>) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isAuthenticated, isReady, session } = useAuthSession();
  const userId = session?.user?.id ?? "anon";
  const { activeOrgId, mySchools, mySchoolsPending } = useSchoolActiveOrgId();
  const orgId = activeOrgId ?? "";
  const enabled = Boolean(orgId && schoolId && courseItemId) && !mySchoolsPending;

  const schoolMembership = mySchools.find((row) => row.schoolId === schoolId.trim()) ?? null;

  const orgAccessQuery = useQuery({
    queryKey: schoolQueryKeys.orgAccess(userId, orgId || null),
    queryFn: () => fetchOrgAccess(orgId),
    enabled: isAuthenticated && isReady && Boolean(orgId),
    staleTime: 30_000,
    retry: false,
  });
  const canManage = userCanManageSchoolWorkspace(
    orgAccessQuery.data?.permissions,
    orgAccessQuery.data?.roleKeys,
    schoolMembership?.roleKeys,
  );

  const detailQuery = useQuery({
    queryKey: schoolQueryKeys.courseExercise(orgId, schoolId, courseItemId, exerciseId ?? ""),
    queryFn: () => fetchCourseExercise(orgId, schoolId, courseItemId, exerciseId!),
    enabled: enabled && Boolean(exerciseId),
  });

  const productKind: "exercise" | "test" =
    detailQuery.data?.kind === "test" || kind === "test" ? "test" : "exercise";
  const backHref = `/features/school/${encodeURIComponent(schoolId)}/course/${encodeURIComponent(courseItemId)}?nav=exercise${
    productKind === "test" ? "&tab=test" : ""
  }`;

  const ghostId = detailQuery.data?.ghostId?.trim() || "";
  const ghostQuery = useQuery({
    queryKey: schoolQueryKeys.ghost(orgId, schoolId, ghostId || "none"),
    queryFn: () => fetchSchoolGhost(orgId, schoolId, ghostId),
    enabled: enabled && Boolean(ghostId),
  });

  const canEditWork = useMemo(() => {
    // Non-ghost exercises: any org member who can open the editor may save (existing behavior).
    if (!ghostId) return true;
    if (canManage) return true;
    const ghost = ghostQuery.data;
    if (!ghost) return false;
    const uid = session?.user?.id;
    if (!uid) return false;
    if (ghost.createdByUserId === uid) {
      const end =
        ghost.nodes.find((n) => n.role === "end") ??
        ghost.nodes.find((n) => n.isDefault) ??
        ghost.nodes[0];
      // Creator keeps access when end is still unassigned (pre-auto-assign ghosts).
      if (!end || end.assigneeUserIds.length === 0) return true;
    }
    const end =
      ghost.nodes.find((n) => n.role === "end") ??
      ghost.nodes.find((n) => n.isDefault) ??
      ghost.nodes[0];
    if (!end) return false;
    return end.assigneeUserIds.includes(uid);
  }, [canManage, ghostId, ghostQuery.data, session?.user?.id]);

  const accessHint = useMemo(() => {
    if (!ghostId || canEditWork) return null;
    const ghost = ghostQuery.data;
    const end =
      ghost?.nodes.find((n) => n.role === "end") ??
      ghost?.nodes.find((n) => n.isDefault) ??
      ghost?.nodes[0];
    const hasAssignees = Boolean(end && end.assigneeUserIds.length > 0);
    return hasAssignees
      ? "Read-only — only people assigned to this ghost node can edit and save."
      : "Read-only — a school manager must assign someone on Ghost Ops before work can be saved.";
  }, [canEditWork, ghostId, ghostQuery.data]);

  const resources = useMemo((): ExerciseSidebarResource[] => {
    const ghost = ghostQuery.data;
    if (!ghost) return [];
    const end =
      ghost.nodes.find((n) => n.role === "end") ??
      ghost.nodes.find((n) => n.isDefault) ??
      null;
    const endId = end?.id ?? "";
    const items: ExerciseSidebarResource[] = [];

    const mediaFromHead = (head: Record<string, unknown>) => {
      const mediaId =
        typeof head.mediaId === "string"
          ? head.mediaId.trim()
          : typeof head.media_id === "string"
            ? head.media_id.trim()
            : "";
      const previewUrl =
        typeof head.previewUrl === "string"
          ? head.previewUrl.trim()
          : typeof head.preview_url === "string"
            ? head.preview_url.trim()
            : typeof head.playbackUrl === "string"
              ? head.playbackUrl.trim()
              : "";
      const fileName =
        typeof head.fileName === "string"
          ? head.fileName.trim()
          : typeof head.file_name === "string"
            ? head.file_name.trim()
            : "";
      return { mediaId, previewUrl, fileName };
    };

    for (const node of ghost.nodes) {
      if (node.id === endId || node.role === "end") continue;
      const status = node.status === "merged" ? "approved" : node.status;
      const head = (node.workingHead ?? {}) as Record<string, unknown>;
      const contentType =
        typeof head.contentType === "string"
          ? head.contentType
          : typeof head.content_type === "string"
            ? head.content_type
            : "";
      const media = mediaFromHead(head);
      const usable = status === "approved" || status === "fulfilled" || status === "merged";
      const isResource =
        usable ||
        ((status === "submitted" || contentType === "media_asset") && Boolean(media.mediaId));
      items.push({
        id: node.id,
        name: node.name || "Variant",
        status,
        kind: isResource ? "resource" : "variant",
        detail: media.fileName || contentType || undefined,
        mediaId: media.mediaId || undefined,
        previewUrl: media.previewUrl || undefined,
        fileName: media.fileName || undefined,
        // Allow drag once submitted with media too (reviewer may still approve separately).
        usable: usable || (status === "submitted" && Boolean(media.mediaId || media.previewUrl)),
      });
    }
    if (end) {
      end.availableInputs.forEach((inp, idx) => {
        const label = String(inp.fromName || inp.name || inp.contentType || "Upstream output");
        const mediaId = typeof inp.mediaId === "string" ? inp.mediaId : typeof inp.media_id === "string" ? inp.media_id : "";
        const previewUrl =
          typeof inp.previewUrl === "string"
            ? inp.previewUrl
            : typeof inp.playbackUrl === "string"
              ? inp.playbackUrl
              : "";
        items.push({
          id: `input-${end.id}-${idx}`,
          name: label,
          status: "ready",
          kind: "input",
          detail: typeof inp.contentType === "string" ? inp.contentType : undefined,
          mediaId: mediaId || undefined,
          previewUrl: previewUrl || undefined,
          fileName: typeof inp.fileName === "string" ? inp.fileName : undefined,
          usable: Boolean(mediaId || previewUrl),
        });
      });
    }
    return items;
  }, [ghostQuery.data]);

  const [sidebarTab, setSidebarTab] = useState<"features" | "resources">("features");
  const [activeIndex, setActiveIndex] = useState(0);
  const [questions, setQuestions] = useState<ExerciseQuestionDto[]>(() => [createEmptyQuestion(0)]);
  const [sidebar, setSidebar] = useState<ExerciseSidebarState>({
    title: kind === "test" ? "New Test" : "New Exercise",
    totalMark: "",
    timeMinutes: "",
    takeWithFriend: false,
    visibility: "public",
  });
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [currentId, setCurrentId] = useState<string | null>(exerciseId ?? null);
  const [hydrated, setHydrated] = useState(!exerciseId);

  useEffect(() => {
    if (!detailQuery.data || hydrated) return;
    const ex = detailQuery.data;
    setSidebar({
      title: ex.title || (productKind === "test" ? "New Test" : "New Exercise"),
      totalMark: ex.totalMark != null ? String(ex.totalMark) : "",
      timeMinutes: ex.timeMinutes != null ? String(ex.timeMinutes) : "",
      takeWithFriend: Boolean(ex.takeWithFriend),
      visibility: ex.visibility ?? "public",
    });
    setCoverImageUrl(normalizeCoverUrl(ex.coverImageUrl));
    setQuestions(
      ex.questions && ex.questions.length > 0
        ? [...ex.questions]
        : [createEmptyQuestion(0)],
    );
    setCurrentId(ex.id);
    setHydrated(true);
  }, [detailQuery.data, hydrated, productKind]);

  const payloadQuestions = useMemo(
    () => questions.map((q, order) => ({ ...q, order })),
    [questions],
  );

  const buildWritePayload = (status: "draft" | "published") => {
    const minutes = sidebar.timeMinutes.trim() ? Number(sidebar.timeMinutes) : null;
    const mark = sidebar.totalMark.trim() ? Number(sidebar.totalMark) : null;
    return {
      title: sidebar.title.trim() || (productKind === "test" ? "New Test" : "New Exercise"),
      kind: productKind,
      status,
      visibility: sidebar.visibility,
      takeWithFriend: sidebar.takeWithFriend,
      timeMinutes: Number.isFinite(minutes) ? minutes : null,
      timeTaken: minutes != null && Number.isFinite(minutes) ? `${minutes} minute` : "",
      totalMark: Number.isFinite(mark) ? mark : null,
      totalQuestions: payloadQuestions.length,
      // Keep the cover the user already set (create modal / prior edit). Never overwrite with a stock image.
      coverImageUrl: normalizeCoverUrl(coverImageUrl),
      questions: payloadQuestions,
    };
  };

  const saveMutation = useMutation({
    mutationFn: async (status: "draft" | "published") => {
      if (!canEditWork) {
        throw new Error(accessHint || "You are not assigned to edit this ghost work.");
      }
      const payload = buildWritePayload(status);
      if (currentId) {
        return updateCourseExercise(orgId, schoolId, courseItemId, currentId, payload);
      }
      return createCourseExercise(orgId, schoolId, courseItemId, payload);
    },
    onSuccess: async (ex) => {
      setError(null);
      setCurrentId(ex.id);
      await queryClient.invalidateQueries({
        queryKey: ["school", "course-exercises", orgId, schoolId, courseItemId],
      });
      if (!exerciseId) {
        router.replace(
          `/features/school/${encodeURIComponent(schoolId)}/course/${encodeURIComponent(courseItemId)}/exercises/${encodeURIComponent(ex.id)}/edit`,
        );
      }
      if (ex.status === "published") {
        router.push(backHref);
      }
    },
    onError: (err) => {
      setError(err instanceof ApiError ? err.message : "Could not save exercise.");
    },
  });

  const trashMutation = useMutation({
    mutationFn: async () => {
      if (!currentId) return;
      await deleteCourseExercise(orgId, schoolId, courseItemId, currentId);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["school", "course-exercises", orgId, schoolId, courseItemId],
      });
      router.push(backHref);
    },
    onError: (err) => {
      setError(err instanceof ApiError ? err.message : "Could not delete exercise.");
    },
  });

  if (!enabled && !mySchoolsPending) {
    return <p className="p-6 text-sm text-text-secondary">Select an organization to edit exercises.</p>;
  }

  if (exerciseId && detailQuery.isPending && !hydrated) {
    return <p className="p-6 text-sm text-text-secondary">Loading exercise…</p>;
  }

  if (exerciseId && detailQuery.isError) {
    return (
      <p className="p-6 text-sm text-red-600">
        {detailQuery.error instanceof ApiError ? detailQuery.error.message : "Could not load exercise."}
      </p>
    );
  }

  const busy = saveMutation.isPending || trashMutation.isPending;
  const editLocked = Boolean(ghostId) && !canEditWork;

  return (
    <div
      className={[
        "mx-auto flex min-h-[calc(100vh-5rem)] max-w-[100rem] flex-col",
        CLASS_WORKSPACE_LAYOUT.routeBodyTopPadding,
      ].join(" ")}
    >
      <div className="px-1 sm:px-2">
        <ExerciseWorkspaceHeader title={sidebar.title} backHref={backHref} />
      </div>
      {accessHint ? (
        <p className="mb-3 rounded-md border border-amber-100 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          {accessHint}
        </p>
      ) : null}
      {error ? (
        <p className="mb-3 rounded-md border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-border-default bg-white lg:flex-row">
        <ExerciseQuestionCanvas
          questions={questions}
          activeIndex={Math.min(activeIndex, Math.max(0, questions.length - 1))}
          onActiveIndexChange={setActiveIndex}
          onQuestionsChange={setQuestions}
          readOnly={editLocked}
        />
        <ExerciseWorkspaceSidebar
          state={sidebar}
          sidebarTab={sidebarTab}
          busy={busy || editLocked}
          readOnly={editLocked}
          orgId={orgId}
          resources={resources}
          productKind={productKind}
          onSidebarTabChange={setSidebarTab}
          onChange={(patch) => setSidebar((s) => ({ ...s, ...patch }))}
          onSaveDraft={() => saveMutation.mutate("draft")}
          onPublish={() => saveMutation.mutate("published")}
          onTrash={() => {
            if (!currentId) {
              router.push(backHref);
              return;
            }
            if (window.confirm("Move this exercise to trash?")) {
              trashMutation.mutate();
            }
          }}
        />
      </div>
    </div>
  );
}
