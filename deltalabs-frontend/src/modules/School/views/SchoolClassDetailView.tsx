"use client";

/** ################################ IMPORT ############################# */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState } from "react";

import { Button } from "@/components/theme";
import { useAuthSession } from "@/contexts/AuthSession_Context";
import { ApiError } from "@/lib/apiClient";
import {
  createClassSession,
  fetchClassSessions,
  fetchOrgAccess,
  fetchSchoolWorkspaceItem,
  updateClassSession,
} from "@/modules/School/api";
import {
  ClassNewSessionModals,
  ClassPageHeader,
  ClassSessionCard,
  ClassSessionSection,
  ClassSessionsEmptyState,
  ClassStudentsTablePanel,
  ClassParentsTablePanel,
  ClassTeachersTablePanel,
  ClassGradesTablePanel,
  ClassScheduleTablePanel,
  ClassAssignmentsTablePanel,
  ClassAttendancePanel,
  safeClassReturnHref,
  userCanManageSchoolClassWorkspace,
} from "@/modules/School/class";
import { isBuiltClassNavSection, type ClassNavId } from "@/modules/School/class/classBottomNavConfig";
import { schoolQueryKeys } from "@/modules/School/hooks/schoolQueryKeys";
import { useSchoolActiveOrgId } from "@/modules/School/hooks/useSchoolActiveOrgId";
/** ################################ /IMPORT ############################# */

/** ################################ TYPES ############################# */
type SchoolClassDetailViewProps = Readonly<{
  schoolId: string;
  classItemId: string;
}>;
/** ################################ /TYPES ############################# */

/** ################################ COMPONENT ############################# */
/** Class workspace page: data + mutations; layout and chrome live in `modules/School/class`. */
export function SchoolClassDetailView({ schoolId, classItemId }: SchoolClassDetailViewProps) {
  const router = useRouter();
  const searchParams = typeof window === "undefined" ? new URLSearchParams() : useSearchParams();
  const queryClient = useQueryClient();
  const { isAuthenticated, isReady, session } = useAuthSession();
  const userId = session?.user?.id ?? "anon";
  const { mySchools, mySchoolsPending, orgsPending } = useSchoolActiveOrgId();
  const cleanSchoolId = schoolId.trim();
  const cleanClassId = classItemId.trim();
  const returnHref = useMemo(
    () => safeClassReturnHref(searchParams.get("returnTo"), cleanSchoolId),
    [searchParams, cleanSchoolId],
  );
  const buildSessionRoomHref = useCallback(
    (id: string) => {
      const path = `/features/school/${encodeURIComponent(cleanSchoolId)}/class/${encodeURIComponent(cleanClassId)}/session/${encodeURIComponent(id)}`;
      const raw = searchParams.get("returnTo");
      if (!raw?.trim()) return path;
      return `${path}?returnTo=${encodeURIComponent(raw.trim())}`;
    },
    [cleanSchoolId, cleanClassId, searchParams],
  );
  const bottomNavSection = searchParams.get("nav");
  const navSectionId = bottomNavSection?.trim() || "class";
  const showClassSessions = !bottomNavSection || bottomNavSection === "class";
  const showClassStudents = bottomNavSection === "students";
  const showClassParents = bottomNavSection === "parents";
  const showClassAttendance = bottomNavSection === "attendance";
  const showClassTeachers = bottomNavSection === "teacher";
  const showClassGrades = bottomNavSection === "grade";
  const showClassSchedules = bottomNavSection === "schedules";
  const showClassAssignments = bottomNavSection === "assignment";

  const schoolMembership = mySchools.find((row) => row.schoolId === cleanSchoolId) ?? null;
  const activeOrgId = schoolMembership?.orgId ?? null;

  const orgAccessQuery = useQuery({
    queryKey: schoolQueryKeys.orgAccess(userId, activeOrgId),
    queryFn: () => fetchOrgAccess(activeOrgId!),
    enabled: isAuthenticated && isReady && Boolean(activeOrgId && cleanSchoolId),
    staleTime: 30_000,
    retry: false,
  });
  const canMutate = userCanManageSchoolClassWorkspace(
    orgAccessQuery.data?.permissions,
    orgAccessQuery.data?.roleKeys,
    schoolMembership?.roleKeys,
  );
  const accessPending = orgAccessQuery.isPending;

  const classItemQuery = useQuery({
    queryKey: schoolQueryKeys.workspaceItem(activeOrgId ?? "unknown-org", cleanSchoolId, cleanClassId),
    queryFn: () => fetchSchoolWorkspaceItem(activeOrgId!, cleanSchoolId, cleanClassId),
    enabled: Boolean(activeOrgId && cleanSchoolId && cleanClassId),
    staleTime: 15_000,
    retry: false,
  });

  const sessionsQuery = useQuery({
    queryKey: schoolQueryKeys.classSessions(activeOrgId ?? "unknown-org", cleanSchoolId, cleanClassId),
    queryFn: () => fetchClassSessions(activeOrgId!, cleanSchoolId, cleanClassId),
    enabled: Boolean(
      activeOrgId &&
        cleanSchoolId &&
        cleanClassId &&
        classItemQuery.data?.type === "class" &&
        showClassSessions,
    ),
    staleTime: 15_000,
    retry: false,
  });

  const [formOpen, setFormOpen] = useState(false);
  const [formTitle, setFormTitle] = useState("");
  const [formWeight, setFormWeight] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formDuration, setFormDuration] = useState("");
  const [formSessionType, setFormSessionType] = useState<"virtual" | "in_person" | "hybrid">("virtual");
  const [formScheduledAt, setFormScheduledAt] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const createSessionMutation = useMutation({
    mutationFn: async () => {
      if (!activeOrgId) throw new Error("Missing organization.");
      const title = formTitle.trim();
      if (!title) throw new Error("Session name is required.");
      const weightRaw = formWeight.trim();
      const durationRaw = formDuration.trim();
      const weight = weightRaw ? Number(weightRaw) : undefined;
      const durationMinutes = durationRaw ? Number.parseInt(durationRaw, 10) : undefined;
      if (weightRaw && Number.isNaN(weight)) throw new Error("Session weight must be a number.");
      if (durationRaw && (Number.isNaN(durationMinutes!) || durationMinutes! < 1)) {
        throw new Error("Duration must be a positive number of minutes.");
      }
      let scheduledAt: string | undefined;
      if (formScheduledAt.trim()) {
        const d = new Date(formScheduledAt);
        if (Number.isNaN(d.getTime())) throw new Error("Invalid date.");
        scheduledAt = d.toISOString();
      }
      return createClassSession(activeOrgId, cleanSchoolId, cleanClassId, {
        title,
        description: formDescription.trim() || undefined,
        weight,
        durationMinutes,
        sessionType: formSessionType,
        scheduledAt,
        creationMode: "single",
      });
    },
    onSuccess: () => {
      setFormOpen(false);
      setFormTitle("");
      setFormWeight("");
      setFormDescription("");
      setFormDuration("");
      setFormSessionType("virtual");
      setFormScheduledAt("");
      setFormError(null);
      if (!activeOrgId) return;
      void queryClient.invalidateQueries({
        queryKey: schoolQueryKeys.classSessions(activeOrgId, cleanSchoolId, cleanClassId),
      });
      void queryClient.invalidateQueries({
        queryKey: schoolQueryKeys.classAttendance(activeOrgId, cleanSchoolId, cleanClassId),
      });
    },
    onError: (e) => {
      if (e instanceof ApiError) {
        setFormError(e.message);
        return;
      }
      if (e instanceof Error) {
        setFormError(e.message);
        return;
      }
      setFormError("Could not create session.");
    },
  });

  const startSessionMutation = useMutation({
    mutationFn: async (sessionId: string) => {
      if (!activeOrgId) throw new Error("Missing organization.");
      return updateClassSession(activeOrgId, cleanSchoolId, cleanClassId, sessionId, { status: "live" });
    },
    onSuccess: (_data, sessionId) => {
      if (!activeOrgId) return;
      void queryClient.invalidateQueries({
        queryKey: schoolQueryKeys.classSessions(activeOrgId, cleanSchoolId, cleanClassId),
      });
      router.push(buildSessionRoomHref(sessionId));
    },
  });

  const wrongType = Boolean(classItemQuery.data && classItemQuery.data.type !== "class");
  const bootstrapLoading = Boolean(cleanSchoolId) && (orgsPending || mySchoolsPending);
  const pageLoading = bootstrapLoading || classItemQuery.isPending;

  function resetForm() {
    setFormTitle("");
    setFormWeight("");
    setFormDescription("");
    setFormDuration("");
    setFormSessionType("virtual");
    setFormScheduledAt("");
    setFormError(null);
  }

  const openNewSessionFlow = () => {
    if (!canMutate || accessPending) return;
    resetForm();
    setFormOpen(true);
  };

  const headerTitle = wrongType ? "Class" : (classItemQuery.data?.title ?? "Class");

  return (
    <main className="min-h-0" aria-label="Class workspace">
      <ClassPageHeader
        title={headerTitle}
        loading={pageLoading}
        wrongType={wrongType}
        onBack={() => router.push(returnHref)}
      />

      {classItemQuery.isError ? (
        <p className="text-sm text-red-600">Could not load this class. It may have been removed.</p>
      ) : wrongType ? (
        <p className="text-sm leading-relaxed text-text-secondary">
          This workspace item is not a class. Open it from the school workspace.
        </p>
      ) : !isBuiltClassNavSection(navSectionId as ClassNavId) ? (
        <div
          className="flex min-h-[22rem] flex-col items-center justify-center rounded-xl border border-dashed border-border-default bg-surface-muted/20 px-6 py-16 text-center"
          role="status"
        >
          <p className="text-sm font-semibold text-text-primary">Coming soon</p>
          <p className="mt-2 max-w-sm text-xs leading-relaxed text-text-tertiary">
            The <span className="font-medium text-text-secondary">{bottomNavSection}</span> area for this class is not
            built yet. Use <span className="font-medium text-text-secondary">Class</span> in the bottom bar for class
            sessions.
          </p>
        </div>
      ) : showClassAssignments ? (
        activeOrgId ? (
          <ClassAssignmentsTablePanel
            orgId={activeOrgId}
            schoolId={cleanSchoolId}
            classItemId={cleanClassId}
            classMetadata={classItemQuery.data?.metadata ?? null}
            canMutate={canMutate && !accessPending}
            onBootstrapped={() => {
              void queryClient.invalidateQueries({
                queryKey: schoolQueryKeys.workspaceItem(activeOrgId, cleanSchoolId, cleanClassId),
              });
            }}
          />
        ) : null
      ) : showClassSchedules ? (
        activeOrgId ? (
          <ClassScheduleTablePanel
            orgId={activeOrgId}
            schoolId={cleanSchoolId}
            classItemId={cleanClassId}
            classMetadata={classItemQuery.data?.metadata ?? null}
            canMutate={canMutate && !accessPending}
            onBootstrapped={() => {
              void queryClient.invalidateQueries({
                queryKey: schoolQueryKeys.workspaceItem(activeOrgId, cleanSchoolId, cleanClassId),
              });
            }}
          />
        ) : null
      ) : showClassGrades ? (
        activeOrgId ? (
          <ClassGradesTablePanel
            orgId={activeOrgId}
            schoolId={cleanSchoolId}
            classItemId={cleanClassId}
            classMetadata={classItemQuery.data?.metadata ?? null}
            canMutate={canMutate && !accessPending}
            onBootstrapped={() => {
              void queryClient.invalidateQueries({
                queryKey: schoolQueryKeys.workspaceItem(activeOrgId, cleanSchoolId, cleanClassId),
              });
            }}
          />
        ) : null
      ) : showClassTeachers ? (
        activeOrgId ? (
          <ClassTeachersTablePanel
            orgId={activeOrgId}
            schoolId={cleanSchoolId}
            classItemId={cleanClassId}
            classMetadata={classItemQuery.data?.metadata ?? null}
            canMutate={canMutate && !accessPending}
            onBootstrapped={() => {
              void queryClient.invalidateQueries({
                queryKey: schoolQueryKeys.workspaceItem(activeOrgId, cleanSchoolId, cleanClassId),
              });
            }}
          />
        ) : null
      ) : showClassAttendance ? (
        activeOrgId ? (
          <ClassAttendancePanel
            orgId={activeOrgId}
            schoolId={cleanSchoolId}
            classItemId={cleanClassId}
            classMetadata={classItemQuery.data?.metadata ?? null}
            canMutate={canMutate && !accessPending}
            onBootstrapped={() => {
              void queryClient.invalidateQueries({
                queryKey: schoolQueryKeys.workspaceItem(activeOrgId, cleanSchoolId, cleanClassId),
              });
            }}
          />
        ) : null
      ) : showClassParents ? (
        activeOrgId ? (
          <ClassParentsTablePanel
            orgId={activeOrgId}
            schoolId={cleanSchoolId}
            classItemId={cleanClassId}
            classMetadata={classItemQuery.data?.metadata ?? null}
            canMutate={canMutate && !accessPending}
            onBootstrapped={() => {
              void queryClient.invalidateQueries({
                queryKey: schoolQueryKeys.workspaceItem(activeOrgId, cleanSchoolId, cleanClassId),
              });
            }}
          />
        ) : null
      ) : showClassStudents ? (
        activeOrgId ? (
          <ClassStudentsTablePanel
            orgId={activeOrgId}
            schoolId={cleanSchoolId}
            classItemId={cleanClassId}
            classMetadata={classItemQuery.data?.metadata ?? null}
            canMutate={canMutate && !accessPending}
            onBootstrapped={() => {
              void queryClient.invalidateQueries({
                queryKey: schoolQueryKeys.workspaceItem(activeOrgId, cleanSchoolId, cleanClassId),
              });
            }}
          />
        ) : null
      ) : (
        <ClassSessionSection
          title="Class Session"
          actions={
            <Button
              type="button"
              variant="primary"
              size="sm"
              className="h-9 gap-1.5 px-4 text-[13px] font-semibold sm:px-5"
              onClick={openNewSessionFlow}
              disabled={!canMutate || accessPending || pageLoading}
              title={!canMutate ? "Requires school:manage on the organization." : undefined}
            >
              <Plus className="size-4" aria-hidden />
              New Session
            </Button>
          }
        >
          {sessionsQuery.isPending ? (
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              {Array.from({ length: 2 }).map((_, i) => (
                <div
                  key={`sk-${i}`}
                  className="h-52 animate-pulse rounded-[0.9rem] border border-border-default bg-surface-muted/40"
                />
              ))}
            </div>
          ) : (sessionsQuery.data?.items.length ?? 0) === 0 ? (
            <ClassSessionsEmptyState onNewSession={openNewSessionFlow} disabled={!canMutate || accessPending} />
          ) : (
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              {(sessionsQuery.data?.items ?? []).map((row) => (
                <ClassSessionCard
                  key={row.id}
                  session={row}
                  canMutate={canMutate && !accessPending}
                  starting={startSessionMutation.isPending && startSessionMutation.variables === row.id}
                  onStart={() => startSessionMutation.mutate(row.id)}
                  onJoinLive={row.status === "live" ? () => router.push(buildSessionRoomHref(row.id)) : undefined}
                />
              ))}
            </div>
          )}
        </ClassSessionSection>
      )}

      <ClassNewSessionModals
        formOpen={formOpen}
        onCloseForm={() => setFormOpen(false)}
        form={{
          formTitle,
          setFormTitle,
          formWeight,
          setFormWeight,
          formDescription,
          setFormDescription,
          formDuration,
          setFormDuration,
          formSessionType,
          setFormSessionType,
          formScheduledAt,
          setFormScheduledAt,
          formError,
        }}
        createSessionMutation={createSessionMutation}
        onSubmitCreate={() => {
          setFormError(null);
          createSessionMutation.mutate();
        }}
      />
    </main>
  );
}
/** ################################ /COMPONENT ############################# */
