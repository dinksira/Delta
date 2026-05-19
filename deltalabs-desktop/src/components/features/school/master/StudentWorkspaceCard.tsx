"use client";

/** ################################ IMPORT ############################# */
/** Imports used by this card component. */
import { EllipsisVertical, Users } from "lucide-react";

import { Button } from "@/components/theme";
/** ################################ /IMPORT ############################# */

/** ################################ TYPES ############################# */
/** Type definitions used in this file. */
type StudentWorkspaceCardProps = Readonly<{
  title: string;
  description?: string | null;
  studentCountLabel?: string;
  onPrimaryAction?: () => void;
}>;
/** ################################ /TYPES ############################# */

/** ################################ COMPONENT ############################# */
/** Student card styled to match the school workspace grid design. */
export function StudentWorkspaceCard({
  title,
  description,
  studentCountLabel = "23 Students",
  onPrimaryAction,
}: StudentWorkspaceCardProps) {
  return (
    <article className="flex min-h-[190px] flex-col rounded-[1.1rem] border border-border-default bg-surface-default px-6 py-5 shadow-[0_1px_2px_rgba(2,24,43,0.06)]">
      <div className="flex items-start justify-between gap-3">
        <p className="inline-flex items-center gap-2 text-[2rem] font-semibold tracking-tight text-text-primary">
          <Users className="size-7" aria-hidden />
          {title}
        </p>
        <button type="button" className="text-text-tertiary hover:text-text-secondary" aria-label="More options">
          <EllipsisVertical className="size-5" aria-hidden />
        </button>
      </div>

      <p className="mt-6 text-[2rem] text-primary-700">{description ?? "Student Registration"}</p>

      <div className="mt-auto flex items-center justify-between pt-6">
        <span className="text-[2rem] text-text-tertiary">{studentCountLabel}</span>
        <Button type="button" variant="primary" size="sm" className="h-14 min-w-[13rem] px-6 text-[1.15rem]" onClick={onPrimaryAction}>
          Go to Students
        </Button>
      </div>
    </article>
  );
}
/** ################################ /COMPONENT ############################# */
