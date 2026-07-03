"use client";

import { Check, Eye, MapPin, X } from "lucide-react";
import type { CSSProperties, ReactNode, Ref } from "react";

import { CONTENT_TYPE_META } from "@/modules/School/roadmap/contentTypeMeta";
import type { ClassRoadmapContentItem } from "@/modules/School/roadmap/types";

export function ClassRoadmapContentCard({
  item,
  step,
  isCurrent,
  canMutate,
  onRemove,
  onToggleComplete,
  onSetCurrent,
  containerRef,
  containerStyle,
  dragHandle,
}: Readonly<{
  item: ClassRoadmapContentItem;
  step: number;
  isCurrent: boolean;
  canMutate: boolean;
  onRemove?: () => void;
  onToggleComplete?: () => void;
  onSetCurrent?: () => void;
  containerRef?: Ref<HTMLDivElement>;
  containerStyle?: CSSProperties;
  dragHandle?: ReactNode;
}>) {
  const meta = CONTENT_TYPE_META[item.contentType] ?? CONTENT_TYPE_META.session;
  const Icon = meta.icon;
  const done = item.status === "completed";

  return (
    <div
      ref={containerRef}
      style={containerStyle}
      className={[
        "w-full rounded-lg border px-2 py-2 shadow-sm",
        isCurrent
          ? "border-primary-400 bg-primary-50/60 ring-1 ring-primary-200"
          : done
            ? "border-emerald-200/80 bg-emerald-50/30"
            : "border-border-default/80 bg-white",
      ].join(" ")}
    >
      <div className="flex items-start gap-1.5">
        {dragHandle}

        <span
          className={[
            "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full text-[9px] font-bold",
            done ? "bg-emerald-600 text-white" : isCurrent ? "bg-primary-600 text-white" : "bg-surface-muted text-text-tertiary",
          ].join(" ")}
        >
          {done ? <Check className="size-3" aria-hidden /> : step}
        </span>

        <span className="mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-md bg-surface-muted text-text-secondary">
          <Icon className="size-3.5" aria-hidden />
        </span>

        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-semibold leading-snug text-text-primary">{item.title}</p>
          {item.subtitle ? (
            <p className="mt-0.5 truncate text-[10px] leading-snug text-text-tertiary">{item.subtitle}</p>
          ) : null}
          <div className="mt-1 flex flex-wrap items-center gap-1">
            <span className="rounded bg-surface-muted px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wide text-text-tertiary">
              {meta.label}
            </span>
            {isCurrent ? (
              <span className="inline-flex items-center gap-0.5 rounded-full bg-primary-600 px-1.5 py-0.5 text-[9px] font-semibold text-white">
                <MapPin className="size-2.5" aria-hidden />
                Now
              </span>
            ) : null}
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-1">
          {canMutate && onToggleComplete ? (
            <button
              type="button"
              className="text-[10px] font-medium text-text-tertiary hover:text-primary-600"
              onClick={onToggleComplete}
            >
              {done ? "Undo" : "Done"}
            </button>
          ) : null}
          <div className="flex items-center gap-0.5">
            {canMutate && onSetCurrent && !isCurrent ? (
              <button
                type="button"
                className="text-[10px] font-medium text-text-tertiary hover:text-primary-600"
                onClick={onSetCurrent}
              >
                Here
              </button>
            ) : null}
            <button
              type="button"
              className="inline-flex rounded p-0.5 text-text-tertiary hover:text-primary-600"
              aria-label={`Preview ${item.title}`}
            >
              <Eye className="size-3.5" aria-hidden />
            </button>
            {canMutate && onRemove ? (
              <button
                type="button"
                className="rounded p-0.5 text-text-tertiary hover:text-text-secondary"
                aria-label={`Remove ${item.title}`}
                onClick={onRemove}
              >
                <X className="size-3.5" aria-hidden />
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
