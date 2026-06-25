"use client";

import { Presentation, Settings2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState } from "react";

import { Button } from "@/components/theme";
import { ClassAttendanceCreateSessionModal } from "@/modules/School/attendance/ClassAttendanceCreateSessionModal";
import { ClassAttendanceDevicesTable } from "@/modules/School/attendance/ClassAttendanceDevicesTable";
import { ClassAttendanceEmptyState } from "@/modules/School/attendance/ClassAttendanceEmptyState";
import { ClassAttendanceMainTable } from "@/modules/School/attendance/ClassAttendanceMainTable";
import { ClassAttendanceRegisterDeviceModal } from "@/modules/School/attendance/ClassAttendanceRegisterDeviceModal";
import { ClassAttendanceSideRail } from "@/modules/School/attendance/ClassAttendanceSideRail";
import { LeaveRequestsTablePanel } from "@/modules/School/attendance/LeaveRequestsTablePanel";
import { useClassAttendanceState } from "@/modules/School/attendance/useClassAttendanceState";
import { useClassAttendanceStudents } from "@/modules/School/attendance/useClassAttendanceStudents";
import type { ClassAttendanceView } from "@/modules/School/attendance/types";
import { parseClassAttendanceView } from "@/modules/School/class/classNavigation";

export function ClassAttendancePanel({
  orgId,
  schoolId,
  classItemId,
  classMetadata,
  canMutate,
  onBootstrapped,
}: Readonly<{
  orgId: string;
  schoolId: string;
  classItemId: string;
  classMetadata: Record<string, unknown> | null | undefined;
  canMutate: boolean;
  onBootstrapped?: () => void;
}>) {
  const router = useRouter();
  const searchParams = typeof window === "undefined" ? new URLSearchParams() : useSearchParams();
  const basePath = `/features/school/${encodeURIComponent(schoolId)}/class/${encodeURIComponent(classItemId)}`;

  const attendanceView = parseClassAttendanceView(searchParams.get("attendanceView"));

  const setAttendanceView = useCallback(
    (view: ClassAttendanceView) => {
      const next = new URLSearchParams(searchParams.toString());
      next.set("nav", "attendance");
      if (view === "sessions") next.delete("attendanceView");
      else next.set("attendanceView", view);
      const qs = next.toString();
      router.replace(qs ? `${basePath}?${qs}` : basePath, { scroll: false });
    },
    [basePath, router, searchParams],
  );

  const goToClassSessions = useCallback(() => {
    router.replace(`${basePath}?nav=class`, { scroll: false });
  }, [basePath, router]);

  const {
    state,
    loading: attendanceLoading,
    updateSessionSettings,
    registerDevice,
    toggleMark,
    updateFormulaConfig,
    updateRealtimeTrack,
    updateFaceDetectionSettings,
  } = useClassAttendanceState({ orgId, schoolId, classItemId });
  const { students, loading: studentsLoading } = useClassAttendanceStudents({
    orgId,
    schoolId,
    classMetadata,
  });

  const [sessionModalOpen, setSessionModalOpen] = useState(false);
  const [deviceModalOpen, setDeviceModalOpen] = useState(false);

  const sessionsContent = (() => {
    if (attendanceLoading) {
      return <div className="h-52 animate-pulse rounded-xl border border-border-default bg-surface-muted/40" />;
    }

    if (state.sessions.length === 0) {
      return (
        <ClassAttendanceEmptyState
          title="No class sessions yet"
          subtitle="Create sessions on the Class tab first — each session becomes an attendance column here."
          action={
            <Button
              type="button"
              variant="primary"
              size="sm"
              className="min-w-[14rem] gap-1.5 px-6 py-2.5 text-sm"
              onClick={goToClassSessions}
            >
              <Presentation className="size-4" aria-hidden />
              Go to Class sessions
            </Button>
          }
        />
      );
    }

    if (studentsLoading) {
      return <div className="h-52 animate-pulse rounded-xl border border-border-default bg-surface-muted/40" />;
    }

    return (
      <div className="space-y-3">
        {canMutate ? (
          <div className="flex justify-end">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="gap-1.5"
              onClick={() => setSessionModalOpen(true)}
            >
              <Settings2 className="size-4" aria-hidden />
              Session settings
            </Button>
          </div>
        ) : null}
        <ClassAttendanceMainTable
          sessions={state.sessions}
          students={students}
          marks={state.marks}
          formulaConfig={state.formulaConfig}
          realtimeTrack={state.realtimeTrack}
          canMutate={canMutate}
          onToggleMark={(studentId, sessionId) => toggleMark(studentId, sessionId, canMutate)}
          onSaveFormulaConfig={updateFormulaConfig}
          onChangeRealtimeTrack={updateRealtimeTrack}
          onSaveFaceDetectionSettings={updateFaceDetectionSettings}
        />
      </div>
    );
  })();

  const leaveContent = (
    <LeaveRequestsTablePanel
      orgId={orgId}
      schoolId={schoolId}
      classItemId={classItemId}
      classMetadata={classMetadata}
      canMutate={canMutate}
      onBootstrapped={onBootstrapped ?? (() => {})}
    />
  );

  const devicesContent = (
    <ClassAttendanceDevicesTable
      devices={state.devices}
      canMutate={canMutate}
      onRegister={() => setDeviceModalOpen(true)}
    />
  );

  return (
    <>
      <div className="flex min-h-[min(420px,calc(100dvh-14rem))] items-center gap-3 sm:gap-5">
        <ClassAttendanceSideRail activeView={attendanceView} onSelect={setAttendanceView} />
        <div className="min-w-0 flex-1 self-stretch py-2">
          {attendanceView === "sessions" ? sessionsContent : null}
          {attendanceView === "leave" ? leaveContent : null}
          {attendanceView === "devices" ? devicesContent : null}
        </div>
      </div>

      <ClassAttendanceCreateSessionModal
        open={sessionModalOpen}
        sessions={state.sessions}
        onClose={() => setSessionModalOpen(false)}
        onSubmit={(input) => {
          updateSessionSettings(input);
          setSessionModalOpen(false);
        }}
      />
      <ClassAttendanceRegisterDeviceModal
        open={deviceModalOpen}
        onClose={() => setDeviceModalOpen(false)}
        sessionOptions={state.sessions.map((session) => ({ id: session.id, title: session.title }))}
        defaultSessionLabel={state.sessions[0]?.title ?? "Class Attendance"}
        onSubmit={(input) => {
          registerDevice(input);
          setDeviceModalOpen(false);
        }}
      />
    </>
  );
}
