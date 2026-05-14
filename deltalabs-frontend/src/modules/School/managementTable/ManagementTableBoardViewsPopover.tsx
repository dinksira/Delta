"use client";

import {
  BarChart3,
  Calendar,
  CalendarCheck,
  ChevronRight,
  CircleHelp,
  Columns3,
  FileText,
  Heart,
  LayoutDashboard,
  LineChart,
  Network,
  PieChart,
  Puzzle,
  Sparkles,
  Table2,
} from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";

type ManagementTableBoardViewsPopoverProps = Readonly<{
  open: boolean;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLButtonElement | null>;
}>;

function SectionTitle({ children, action }: Readonly<{ children: string; action?: React.ReactNode }>) {
  return (
    <div className="flex items-center justify-between px-3 pb-1.5 pt-2.5">
      <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-text-tertiary">{children}</span>
      {action}
    </div>
  );
}

function Divider() {
  return <div className="my-1 h-px bg-border-default" role="separator" />;
}

function MenuRow({
  icon: Icon,
  label,
  muted,
  badge,
  onClick,
}: Readonly<{
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  label: string;
  muted?: boolean;
  badge?: string;
  onClick?: () => void;
}>) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "flex w-full items-center gap-3 px-3 py-2 text-left text-sm transition-colors",
        muted
          ? "text-text-tertiary hover:bg-surface-muted hover:text-text-secondary"
          : "font-medium text-text-primary hover:bg-surface-muted",
      ].join(" ")}
    >
      <Icon className="size-4 shrink-0 opacity-85" aria-hidden />
      <span className="min-w-0 flex-1">{label}</span>
      {badge ? (
        <span className="shrink-0 rounded border border-primary-500 px-1.5 py-px text-[10px] font-semibold uppercase tracking-wide text-primary-600">
          {badge}
        </span>
      ) : null}
    </button>
  );
}

export function ManagementTableBoardViewsPopover({ open, onClose, anchorRef }: ManagementTableBoardViewsPopoverProps) {
  const panelId = useId();
  const panelRef = useRef<HTMLDivElement | null>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  const syncPos = useCallback(() => {
    const el = anchorRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const width = 300;
    const left = Math.max(8, Math.min(r.left, window.innerWidth - width - 8));
    setPos({ top: r.bottom + 8, left });
  }, [anchorRef]);

  useEffect(() => {
    if (!open) {
      setPos(null);
      return;
    }
    syncPos();
  }, [open, syncPos]);

  useEffect(() => {
    if (!open) return;
    const onScroll = () => syncPos();
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onScroll);
    };
  }, [open, syncPos]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (panelRef.current?.contains(t) || anchorRef.current?.contains(t)) return;
      onClose();
    };
    document.addEventListener("pointerdown", onPointerDown, true);
    return () => document.removeEventListener("pointerdown", onPointerDown, true);
  }, [open, onClose, anchorRef]);

  const soon = () => {
    window.alert("This view is not available yet.");
  };

  if (!open || !pos) return null;

  return createPortal(
    <div
      ref={panelRef}
      id={panelId}
      role="dialog"
      aria-modal="true"
      aria-labelledby={`${panelId}-heading`}
      className="fixed z-[4400] w-[min(300px,calc(100vw-16px))] overflow-hidden rounded-xl border border-border-default bg-surface-default py-1 shadow-xl"
      style={{ top: pos.top, left: pos.left }}
    >
      <div className="absolute -top-1.5 left-4 h-3 w-3 rotate-45 border-l border-t border-border-default bg-surface-default" aria-hidden />
      <div className="relative bg-surface-default pt-0.5">
        <div className="flex items-center justify-between px-3 pb-1.5 pt-2.5">
          <span id={`${panelId}-heading`} className="text-[11px] font-semibold uppercase tracking-[0.14em] text-text-tertiary">
            Board views
          </span>
          <button
            type="button"
            className="rounded p-1 text-text-tertiary hover:bg-surface-muted hover:text-text-secondary"
            title="About board views"
            onClick={() => window.alert("Choose how this board is displayed. More views are coming soon.")}
          >
            <CircleHelp className="size-3.5" aria-hidden />
          </button>
        </div>

        <button
          type="button"
          className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm font-semibold text-text-primary hover:bg-surface-muted"
          onClick={onClose}
        >
          <Table2 className="size-4 shrink-0 text-primary-600" aria-hidden />
          <span className="min-w-0 flex-1">Table</span>
        </button>
        <p className="px-3 pb-1 pl-[2.75rem] text-[11px] font-medium text-primary-600">Current view</p>

        <MenuRow icon={BarChart3} label="Gantt" muted onClick={soon} />
        <MenuRow icon={PieChart} label="Chart" muted onClick={soon} />
        <MenuRow icon={Calendar} label="Calendar" muted onClick={soon} />
        <MenuRow icon={Columns3} label="Kanban" muted onClick={soon} />
        <MenuRow icon={CalendarCheck} label="Roadmap tracker" muted onClick={soon} />
        <MenuRow icon={Network} label="Hierarchy" muted badge="New" onClick={soon} />
        <MenuRow icon={LineChart} label="Agile insights" muted onClick={soon} />
        <MenuRow icon={FileText} label="Doc" muted onClick={soon} />
        <MenuRow icon={LayoutDashboard} label="Dashboard" muted onClick={soon} />

        <Divider />
        <SectionTitle>Build with Vibe</SectionTitle>
        <MenuRow icon={Heart} label="Task Tracker" muted onClick={soon} />
        <MenuRow icon={Heart} label="Project Overview" muted onClick={soon} />
        <MenuRow icon={Sparkles} label="Build app from scratch" muted onClick={soon} />

        <Divider />
        <button
          type="button"
          disabled
          className="flex w-full cursor-not-allowed items-center gap-3 px-3 py-2 text-left text-sm text-text-tertiary/55"
        >
          <Puzzle className="size-4 shrink-0" aria-hidden />
          <span className="min-w-0 flex-1 font-medium">Apps</span>
          <ChevronRight className="size-4 shrink-0 opacity-50" aria-hidden />
        </button>

        <Divider />
        <button
          type="button"
          className="w-full px-3 py-2.5 text-left text-sm font-medium text-primary-600 hover:bg-surface-muted"
          onClick={() => {
            onClose();
            window.alert("More views are coming soon.");
          }}
        >
          Explore more views
        </button>
      </div>
    </div>,
    document.body,
  );
}
