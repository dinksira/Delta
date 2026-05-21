import { ArrowLeft, Presentation } from "lucide-react";

import { SchoolDetailUtilityActions } from "@/components/features/school/SchoolDetailUtilityActions";
import { CLASS_WORKSPACE_LAYOUT } from "@/modules/School/class/layoutConstants";

/**
 * One row: back + class icon + title (left) **parallel** to Integrate / Automate / Invite (right),
 * matching the reference layout and avoiding a squeezed title.
 */
export function ClassPageHeader({
  title,
  onBack,
  loading,
  wrongType,
}: Readonly<{
  title: string;
  onBack: () => void;
  loading: boolean;
  wrongType: boolean;
}>) {
  return (
    <header className="mb-7 sm:mb-9">
      <div className="flex flex-nowrap items-center justify-between gap-2.5 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-2.5">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border-default bg-surface-default text-text-secondary transition-colors hover:bg-surface-muted sm:h-9 sm:w-9"
            aria-label="Back to school workspace"
          >
            <ArrowLeft className="size-4 sm:size-[1.05rem]" aria-hidden />
          </button>
          <span
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border-default bg-surface-default text-text-secondary sm:h-9 sm:w-9"
            aria-hidden
            title="Class"
          >
            <Presentation className="size-3.5 sm:size-4" aria-hidden />
          </span>
          <div className="min-w-0 flex-1 pr-1">
            {loading ? (
              <div className="h-8 w-52 max-w-full animate-pulse rounded-md bg-surface-muted sm:h-9 sm:w-72" />
            ) : wrongType ? (
              <h1 className="text-base font-semibold text-text-primary sm:text-lg">Not a class</h1>
            ) : (
              <h1 className={[CLASS_WORKSPACE_LAYOUT.pageHeaderTitleClass, "line-clamp-2 sm:line-clamp-3"].join(" ")}>
                {title}
              </h1>
            )}
          </div>
        </div>
        {wrongType ? null : (
          <div className="ml-1 shrink-0 pl-1 sm:ml-2 sm:pl-2">
            <SchoolDetailUtilityActions />
          </div>
        )}
      </div>
    </header>
  );
}
