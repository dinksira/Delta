/** ################################ IMPORT ############################# */
/** Imports used by this file. */
import type { ReactNode } from "react";

import { Button, ButtonLink } from "@/components/theme";
import { Plus } from "lucide-react";

import { SchoolSectionHeading } from "@/components/features/school/SchoolSectionHeading";
import { cx } from "@/components/theme/utils";

/** ################################ /IMPORT ############################# */
/** ################################ TYPES ############################# */
/** Type definitions used in this file. */
type SchoolWorkspaceHeaderProps = Readonly<{
  /** Primary line (e.g. "My School"). Omit all text lines for a header with actions only. */
  title?: string;
  /** Optional second line (e.g. section name). */
  subtitle?: string;
  /** Optional breadcrumb prefix shown before title (lighter). */
  eyebrow?: string;
  actionSlot?: ReactNode;
  onAddSchool?: () => void;
  addSchoolHref?: string;
}>;

/** ################################ /TYPES ############################# */
/** ################################ COMPONENT ############################# */
/** Main exported component logic for this file. */
export function SchoolWorkspaceHeader({
  title,
  subtitle,
  eyebrow,
  actionSlot,
  onAddSchool,
  addSchoolHref,
}: SchoolWorkspaceHeaderProps) {
  const hasHeading = Boolean(eyebrow || title || subtitle);

  return (
    <header
      className={cx(
        "flex flex-col gap-4 bg-surface-canvas py-5 sm:flex-row sm:items-start sm:py-6",
        hasHeading ? "sm:justify-between" : "sm:justify-end",
      )}
    >
      <SchoolSectionHeading eyebrow={eyebrow} title={title} subtitle={subtitle} titleAs="h1" />
      <div className="shrink-0 sm:pt-1">
        {actionSlot ?? (
          <>
            {addSchoolHref ? (
              <ButtonLink href={addSchoolHref} variant="primary" className="gap-2">
                <Plus className="size-4" aria-hidden />
                Add School
              </ButtonLink>
            ) : (
              <Button type="button" variant="primary" className="gap-2" onClick={onAddSchool}>
                <Plus className="size-4" aria-hidden />
                Add School
              </Button>
            )}
          </>
        )}
      </div>
    </header>
  );
}
/** ################################ /COMPONENT ############################# */
