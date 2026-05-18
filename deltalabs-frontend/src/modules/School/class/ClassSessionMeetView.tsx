"use client";

/** ################################ IMPORT ############################# */
import type { ComponentType, ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { DoorOpen, Hand, MessageSquare, Mic, MicOff, Presentation, Share2, Users, Video, VideoOff } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";

import { SchoolConfirmActionModal } from "@/components/features/school/master/SchoolConfirmActionModal";
import { useAuthSession } from "@/contexts/AuthSession_Context";
import { fetchClassSessions } from "@/modules/School/api";
import { schoolQueryKeys } from "@/modules/School/hooks/schoolQueryKeys";
import { useSchoolActiveOrgId } from "@/modules/School/hooks/useSchoolActiveOrgId";
/** ################################ /IMPORT ############################# */

/** ################################ TYPES ############################# */
type MobileView = "stage" | "chat" | "people";
type SidebarTool = "people" | "chat" | "board";

type MockParticipant = Readonly<{
  id: string;
  name: string;
  muted: boolean;
  isYou?: boolean;
}>;
/** ################################ /TYPES ############################# */

/** ################################ CONSTANTS ############################# */
const MOCK_PEOPLE: readonly MockParticipant[] = [
  { id: "1", name: "Hilina", muted: false },
  { id: "2", name: "Fikir", muted: true },
  { id: "3", name: "Mahlet", muted: true },
  { id: "4", name: "Dink", muted: false },
  { id: "5", name: "You", muted: false, isYou: true },
] as const;

/** Figma: soft gray sidebar — seamless with main (no stroke between columns). */
const SIDEBAR_BG = "bg-[#eef2f5]";
const MAIN_BG = "bg-white";
/** ################################ /CONSTANTS ############################# */

/** ################################ COMPONENT ############################# */
/**
 * Meet-style live session: **one** app chrome row (Delta header). Session title row only on
 * the **main stage** on mobile. **People** / **Chat** / **Stage** use a **single** minimized
 * circular bottom dock (mock: People | Chat | whiteboard/stage). Call controls only on stage.
 */
export function ClassSessionMeetView({
  schoolId,
  classItemId,
  sessionId,
}: Readonly<{
  schoolId: string;
  classItemId: string;
  sessionId: string;
}>) {
  const router = useRouter();
  const searchParams = typeof window === "undefined" ? new URLSearchParams() : useSearchParams();
  const { session } = useAuthSession();
  const { mySchools } = useSchoolActiveOrgId();

  const cleanSchoolId = schoolId.trim();
  const cleanClassId = classItemId.trim();
  const cleanSessionId = sessionId.trim();

  const returnToRaw = searchParams.get("returnTo");
  const classListHref = useMemo(() => {
    const qs = returnToRaw?.trim() ? `?returnTo=${encodeURIComponent(returnToRaw.trim())}` : "";
    return `/features/school/${encodeURIComponent(cleanSchoolId)}/class/${encodeURIComponent(cleanClassId)}${qs}`;
  }, [cleanSchoolId, cleanClassId, returnToRaw]);

  const schoolMembership = mySchools.find((row) => row.schoolId === cleanSchoolId) ?? null;
  const activeOrgId = schoolMembership?.orgId ?? null;

  const sessionsQuery = useQuery({
    queryKey: schoolQueryKeys.classSessions(activeOrgId ?? "unknown-org", cleanSchoolId, cleanClassId),
    queryFn: () => fetchClassSessions(activeOrgId!, cleanSchoolId, cleanClassId),
    enabled: Boolean(activeOrgId && cleanSchoolId && cleanClassId),
    staleTime: 10_000,
    retry: false,
  });

  const sessionRow = useMemo(
    () => (sessionsQuery.data?.items ?? []).find((s) => s.id === cleanSessionId) ?? null,
    [sessionsQuery.data?.items, cleanSessionId],
  );

  const [mobileView, setMobileView] = useState<MobileView>("stage");
  const [sidebarTool, setSidebarTool] = useState<SidebarTool>("people");
  const [micOn, setMicOn] = useState(false);
  const [camOn, setCamOn] = useState(false);
  const [leaveConfirmOpen, setLeaveConfirmOpen] = useState(false);

  const title = sessionRow?.title ?? "Session";
  const initials = useMemo(() => {
    const parts = title.trim().split(/\s+/).filter(Boolean);
    const a = parts[0]?.[0] ?? "S";
    const b = parts[1]?.[0] ?? "";
    return (a + b).toUpperCase().slice(0, 2);
  }, [title]);

  const displayName = (() => {
    const u = session?.user;
    if (!u) return "You";
    const full = u.fullName?.trim();
    if (full) return full;
    if (u.username?.trim()) return u.username.trim();
    return u.email?.split("@")[0] ?? "You";
  })();

  const confirmLeaveSession = () => {
    setLeaveConfirmOpen(false);
    router.push(classListHref);
  };

  const sessionsPending = sessionsQuery.isPending;

  const stageBody = (
    <>
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-5 px-4 py-6 sm:gap-6 sm:py-8">
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary-100/90 text-2xl font-semibold text-primary-700 shadow-inner sm:h-32 sm:w-32 sm:text-4xl">
          {initials}
        </div>
        <p className="max-w-sm text-center text-sm leading-relaxed text-text-secondary">
          Video will connect here. This is a full-screen session room (Meet-style layout).
        </p>
      </div>
    </>
  );

  const callControls = (
    <div className="flex shrink-0 flex-wrap items-center justify-center gap-2.5 px-3 py-4 sm:gap-3 sm:py-5">
      <MeetRoundControl
        label={micOn ? "Mute microphone" : "Unmute microphone"}
        active={micOn}
        onClick={() => setMicOn((v) => !v)}
      >
        {micOn ? <Mic className="size-[1.15rem] sm:size-5" aria-hidden /> : <MicOff className="size-[1.15rem] sm:size-5" aria-hidden />}
      </MeetRoundControl>
      <MeetRoundControl
        label={camOn ? "Turn camera off" : "Turn camera on"}
        active={camOn}
        onClick={() => setCamOn((v) => !v)}
      >
        {camOn ? <Video className="size-[1.15rem] sm:size-5" aria-hidden /> : <VideoOff className="size-[1.15rem] sm:size-5" aria-hidden />}
      </MeetRoundControl>
      <MeetRoundControl label="Share screen" variant="accent" onClick={() => undefined}>
        <Share2 className="size-[1.15rem] sm:size-5" aria-hidden />
      </MeetRoundControl>
      <MeetRoundControl label="Raise hand" onClick={() => undefined}>
        <Hand className="size-[1.15rem] sm:size-5" aria-hidden />
      </MeetRoundControl>
      <button
        type="button"
        onClick={() => setLeaveConfirmOpen(true)}
        className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-red-600 text-white shadow-sm transition-colors hover:bg-red-700 sm:h-12 sm:w-12"
        aria-label="Leave session"
        aria-haspopup="dialog"
        aria-expanded={leaveConfirmOpen}
      >
        <DoorOpen className="size-[1.15rem] sm:size-5" aria-hidden />
      </button>
    </div>
  );

  return (
    <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
      {/* —— Mobile: mock-style — contextual header + one bottom dock (no top tab bar) —— */}
      <div className="flex min-h-0 flex-1 flex-col md:hidden">
        {mobileView === "stage" ? <SessionTitleRow avatars={MOCK_PEOPLE.slice(0, 3)} title={title} /> : null}
        {mobileView === "people" ? (
          <div className={`flex shrink-0 items-center px-3 py-3 ${SIDEBAR_BG}`}>
            <h2 className="text-base font-bold tracking-tight text-text-primary">People in exercise</h2>
          </div>
        ) : null}
        {mobileView === "chat" ? (
          <div className={`px-4 py-3 ${MAIN_BG}`}>
            <h2 className="text-base font-bold tracking-tight text-text-primary">In call message</h2>
          </div>
        ) : null}

        <div
          className={[
            "min-h-0 flex-1",
            mobileView === "chat" ? "flex min-h-0 flex-col overflow-hidden" : "overflow-y-auto",
            mobileView === "people" ? SIDEBAR_BG : MAIN_BG,
          ].join(" ")}
        >
          {mobileView === "stage" ? (
            <div className="flex min-h-0 flex-1 flex-col">
              {stageBody}
              <div className="mx-3 mb-3 overflow-hidden rounded-2xl bg-white shadow-[0_1px_8px_rgba(2,24,43,0.06)]">
                <WhiteboardCardChrome />
              </div>
            </div>
          ) : null}
          {mobileView === "chat" ? <MeetChatPanel fillHeight hideHeader /> : null}
          {mobileView === "people" ? (
            <div className="p-3 pt-2">
              <PeopleGrid />
            </div>
          ) : null}
        </div>

        {mobileView === "stage" ? callControls : null}

        <MobileMeetDock value={mobileView} onChange={setMobileView} />
      </div>

      {/* —— Desktop: stage | sidebar — height-bounded so bottom dock stays in view —— */}
      <div className="hidden h-full min-h-0 flex-1 flex-row overflow-hidden md:flex">
        <section className={`flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden ${MAIN_BG}`} aria-label="Session stage">
          <SessionTitleRow avatars={MOCK_PEOPLE.slice(0, 3)} title={title} />
          {stageBody}
          {callControls}
        </section>

        <aside
          className={`grid h-full min-h-0 w-[min(100%,18.5rem)] shrink-0 grid-rows-[minmax(0,1fr)_auto] lg:w-80 ${SIDEBAR_BG}`}
          aria-label="Session sidebar"
        >
          {/* Row 1: scrolls (people/board); chat fills height. Row 2: dock centered. */}
          <div
            className={[
              "min-h-0 overscroll-y-contain",
              sidebarTool === "chat"
                ? `flex flex-col overflow-hidden ${SIDEBAR_BG}`
                : `overflow-y-auto ${SIDEBAR_BG}`,
            ].join(" ")}
          >
            {sidebarTool === "people" ? <PeoplePanel displayName={displayName} /> : null}
            {sidebarTool === "chat" ? (
              <div className="mx-2 mb-2 mt-1 flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl bg-white shadow-[0_1px_8px_rgba(2,24,43,0.06)]">
                <MeetChatPanel fillHeight />
              </div>
            ) : null}
            {sidebarTool === "board" ? (
              <div className="flex min-h-0 flex-col p-2">
                <WhiteboardCardChrome variant="sidebar" />
              </div>
            ) : null}
          </div>
          <div className={SIDEBAR_BG}>
            <SidebarToolDock value={sidebarTool} onChange={setSidebarTool} />
          </div>
        </aside>
      </div>

      <SchoolConfirmActionModal
        open={leaveConfirmOpen}
        title="Leave session?"
        description="You will leave this live class and return to the class page. You can join again if the session is still available."
        confirmLabel="Leave"
        confirmTone="danger"
        onCancel={() => setLeaveConfirmOpen(false)}
        onConfirm={confirmLeaveSession}
      />

      {!sessionsPending && !sessionRow ? (
        <div className="absolute inset-0 z-[2] flex flex-col items-center justify-center gap-3 bg-surface-canvas/95 px-6 text-center">
          <p className="text-sm font-medium text-text-primary">Session not found</p>
          <p className="max-w-xs text-xs text-text-secondary">It may have ended or been removed.</p>
          <Link href={classListHref} className="text-sm font-semibold text-primary-600 underline-offset-2 hover:underline">
            Back to class
          </Link>
        </div>
      ) : null}
    </div>
  );
}

function SessionTitleRow({
  title,
  avatars,
}: Readonly<{
  title: string;
  avatars: readonly MockParticipant[];
}>) {
  return (
    <div className={`flex shrink-0 items-center gap-2.5 px-3 py-3 sm:gap-3 sm:px-4 sm:py-3.5 ${MAIN_BG}`}>
      <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center text-primary-800">
        <Presentation className="size-[1.05rem] sm:size-[1.15rem]" aria-hidden />
      </span>
      <h1 className="min-w-0 flex-1 truncate text-sm font-semibold tracking-tight text-text-primary sm:text-base">{title}</h1>
      <div className="flex shrink-0 -space-x-2">
        {avatars.map((p) => (
          <span
            key={p.id}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-gradient-to-br from-primary-100 to-primary-200 text-[11px] font-bold text-primary-900 shadow-sm"
            title={p.name}
          >
            {p.name.slice(0, 1)}
          </span>
        ))}
      </div>
    </div>
  );
}

/** Minimized circular dock — order matches mock: People · Chat · Stage/board. */
function MobileMeetDock({
  value,
  onChange,
}: Readonly<{
  value: MobileView;
  onChange: (v: MobileView) => void;
}>) {
  const btn = (id: MobileView, label: string, icon: ReactNode) => (
    <button
      key={id}
      type="button"
      aria-label={label}
      aria-pressed={value === id}
      onClick={() => onChange(id)}
      className={[
        "inline-flex h-10 w-10 items-center justify-center rounded-full transition-all sm:h-11 sm:w-11",
        value === id
          ? "scale-105 bg-primary-700 text-white shadow-md"
          : "bg-primary-100/90 text-primary-800 shadow-sm hover:bg-primary-100",
      ].join(" ")}
    >
      {icon}
    </button>
  );
  return (
    <div
      className={`flex shrink-0 items-center justify-center gap-7 py-2.5 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 ${SIDEBAR_BG}`}
      role="toolbar"
      aria-label="Session views"
    >
      {btn("people", "People in exercise", <Users className="size-[1.15rem]" aria-hidden />)}
      {btn("chat", "In-call messages", <MessageSquare className="size-[1.15rem]" aria-hidden />)}
      {btn("stage", "Main stage and board", <Presentation className="size-[1.15rem]" aria-hidden />)}
    </div>
  );
}

/** Bottom-right of sidebar — mock: inactive light circles, active dark teal (slightly larger). */
function SidebarToolDock({
  value,
  onChange,
}: Readonly<{
  value: SidebarTool;
  onChange: (v: SidebarTool) => void;
}>) {
  const iconClass = (active: boolean) => (active ? "size-[1.2rem]" : "size-[1.05rem]");
  type DockIcon = ComponentType<{ className?: string; "aria-hidden"?: boolean | undefined }>;
  const btn = (id: SidebarTool, label: string, Icon: DockIcon) => {
    const active = value === id;
    return (
      <button
        key={id}
        type="button"
        aria-label={label}
        aria-pressed={active}
        title={label}
        onClick={() => onChange(id)}
        className={[
          "inline-flex items-center justify-center rounded-full transition-all duration-150",
          active
            ? "h-12 w-12 scale-105 bg-primary-700 text-white shadow-md"
            : "h-10 w-10 bg-primary-100/95 text-primary-800 shadow-sm hover:bg-primary-100",
        ].join(" ")}
      >
        <Icon className={iconClass(active)} aria-hidden />
      </button>
    );
  };
  return (
    <div
      className="flex w-full shrink-0 items-center justify-center gap-4 px-3 py-3 pb-[max(0.65rem,env(safe-area-inset-bottom))] pt-2.5 sm:gap-5"
      role="toolbar"
      aria-label="Switch between people, chat, and thinking board"
    >
      {btn("people", "People in exercise", Users)}
      {btn("chat", "In call message", MessageSquare)}
      {btn("board", "Thinking board", Presentation)}
    </div>
  );
}

function MeetRoundControl({
  label,
  children,
  onClick,
  active = false,
  variant = "default",
}: Readonly<{
  label: string;
  children: ReactNode;
  onClick: () => void;
  active?: boolean;
  variant?: "default" | "accent";
}>) {
  const base =
    "inline-flex h-11 w-11 items-center justify-center rounded-full text-text-secondary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 sm:h-12 sm:w-12";
  const styles =
    variant === "accent"
      ? "bg-primary-500 text-white shadow-sm hover:bg-primary-600"
      : active
        ? "bg-primary-100 text-primary-800 shadow-inner hover:bg-primary-200/90"
        : "bg-primary-100/80 shadow-sm hover:bg-primary-100";
  return (
    <button type="button" className={[base, styles].join(" ")} aria-label={label} onClick={onClick}>
      {children}
    </button>
  );
}

function MeetChatPanel({
  hideHeader = false,
  fillHeight = false,
}: Readonly<{ hideHeader?: boolean; fillHeight?: boolean }>) {
  const messagesClass = [
    "px-4 py-3",
    MAIN_BG,
    fillHeight ? "min-h-0 flex-1 overflow-y-auto" : "min-h-[12rem] flex-1",
  ].join(" ");
  const inputBar = (
    <div className={`shrink-0 p-3 ${MAIN_BG}`}>
      <input
        type="text"
        readOnly
        placeholder="Type Something…"
        className="h-11 w-full rounded-full bg-primary-50/80 px-4 text-sm text-text-primary outline-none ring-1 ring-primary-200/40 placeholder:text-text-tertiary focus:ring-2 focus:ring-primary-400/50"
      />
    </div>
  );
  const header =
    hideHeader ? null : (
      <div className={`shrink-0 px-4 py-3 ${MAIN_BG}`}>
        <h2 className="text-sm font-semibold text-text-primary">In call message</h2>
      </div>
    );
  const inner = (
    <>
      {header}
      <div className={messagesClass} />
      {inputBar}
    </>
  );
  if (fillHeight) {
    return <div className="flex min-h-0 flex-1 flex-col">{inner}</div>;
  }
  return <>{inner}</>;
}

/** “Thinking bord” — compact under main stage on mobile; tall fill in desktop sidebar when board tool is on. */
function WhiteboardCardChrome({ variant = "compact" }: Readonly<{ variant?: "compact" | "sidebar" }>) {
  const canvasMin =
    variant === "sidebar" ? "min-h-[min(42vh,22rem)] flex-1 sm:min-h-[min(48vh,26rem)]" : "min-h-[8.5rem]";
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl bg-white shadow-[0_1px_10px_rgba(2,24,43,0.06)]">
      <p className="shrink-0 px-3 py-2.5 text-sm font-bold tracking-tight text-text-primary">Thinking bord</p>
      <div className="flex shrink-0 items-center justify-between gap-2 px-2 py-2">
        <div className="flex items-center gap-0.5 text-text-tertiary">
          <span className="rounded-md p-2 text-xs font-medium hover:bg-surface-muted" title="Undo">
            ↶
          </span>
          <span className="rounded-md p-2 text-xs font-medium hover:bg-surface-muted" title="Redo">
            ↷
          </span>
          <span className="rounded-md p-2 text-xs font-medium hover:bg-surface-muted" title="Pen">
            ✎
          </span>
          <span className="rounded-md p-2 text-xs font-medium hover:bg-surface-muted" title="Eraser">
            ⌫
          </span>
        </div>
        <div className="flex -space-x-1.5 pr-0.5">
          {MOCK_PEOPLE.slice(0, 3).map((p) => (
            <span
              key={p.id}
              className="inline-flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-primary-200 text-[10px] font-bold text-primary-900 shadow-sm"
            >
              {p.name.slice(0, 1)}
            </span>
          ))}
        </div>
      </div>
      <div
        className={`relative mx-2 mb-2 mt-1 flex items-end justify-end rounded-xl bg-primary-50/50 p-2 ${canvasMin}`}
      >
        <span className="inline-flex rounded-md p-2 text-primary-700/80 hover:bg-white/90" title="Full screen" aria-label="Expand board">
          ⤢
        </span>
      </div>
    </div>
  );
}

function PeoplePanel({ displayName }: Readonly<{ displayName: string }>) {
  return (
    <>
      <div className={`px-4 py-3 ${SIDEBAR_BG}`}>
        <h2 className="text-sm font-semibold text-text-primary">People in exercise</h2>
        <p className="mt-0.5 text-xs text-text-tertiary">Signed in as {displayName}</p>
      </div>
      <div className={`p-3 ${SIDEBAR_BG}`}>
        <PeopleGrid />
      </div>
    </>
  );
}

function PeopleGrid() {
  return (
    <ul className="grid grid-cols-2 gap-2.5 sm:gap-3">
      {MOCK_PEOPLE.map((p) => (
        <li key={p.id}>
          <div
            className={[
              "relative aspect-[4/3] overflow-hidden rounded-xl",
              p.isYou
                ? "bg-gradient-to-b from-primary-800 to-primary-900 shadow-md"
                : "bg-gradient-to-b from-primary-100/95 to-primary-200/85 shadow-sm",
            ].join(" ")}
          >
            <div
              className={[
                "absolute inset-0 flex items-center justify-center text-xl font-semibold",
                p.isYou ? "text-primary-50/95" : "text-primary-800/75",
              ].join(" ")}
            >
              {p.name.slice(0, 1)}
            </div>
            <span className="absolute bottom-2 left-2 rounded-md bg-black/55 px-2 py-0.5 text-[10px] font-medium text-white">
              {p.name}
            </span>
            <span className="absolute bottom-2 right-2 inline-flex h-7 w-7 items-center justify-center rounded-full bg-white/95 text-primary-700 shadow-sm">
              {p.muted ? <MicOff className="size-3.5 text-text-tertiary" aria-hidden /> : <Mic className="size-3.5 text-primary-600" aria-hidden />}
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
}
/** ################################ /COMPONENT ############################# */
