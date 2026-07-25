"use client";

import { ArrowLeft, FileQuestion } from "lucide-react";
import Link from "next/link";

import { SchoolDetailUtilityActions } from "@/components/features/school/SchoolDetailUtilityActions";
import { CLASS_WORKSPACE_LAYOUT } from "@/modules/School/class/layoutConstants";

/** Same header row pattern as Course / Class / Management Table — not a custom Figma chrome. */
export function ExerciseWorkspaceHeader({
  title,
  backHref,
}: Readonly<{
  title: string;
  backHref: string;
}>) {
  return (
    <header className="mb-4 shrink-0 sm:mb-5">
      <div className="flex flex-nowrap items-center justify-between gap-2.5 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-2.5">
          <Link
            href={backHref}
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border-default bg-surface-default text-text-secondary transition-colors hover:bg-surface-muted sm:h-9 sm:w-9"
            aria-label="Back to Exercise & Test"
          >
            <ArrowLeft className="size-4 sm:size-[1.05rem]" aria-hidden />
          </Link>
          <span
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border-default bg-surface-default text-text-secondary sm:h-9 sm:w-9"
            aria-hidden
            title="Exercise"
          >
            <FileQuestion className="size-3.5 sm:size-4" aria-hidden />
          </span>
          <div className="min-w-0 flex-1 pr-1">
            <h1
              className={[CLASS_WORKSPACE_LAYOUT.pageHeaderTitleClass, "line-clamp-2 sm:line-clamp-3"].join(
                " ",
              )}
            >
              {title}
            </h1>
          </div>
        </div>
        <div className="ml-1 shrink-0 pl-1 sm:ml-2 sm:pl-2">
          <SchoolDetailUtilityActions />
        </div>
      </div>
    </header>
  );
}
