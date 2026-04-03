import type { ReactNode } from "react";

import { Button } from "@/components/theme";
import { Plus } from "lucide-react";

import { SchoolSectionHeading } from "@/modules/School/components/SchoolSectionHeading";
import { cx } from "@/components/theme/utils";

type SchoolWorkspaceHeaderProps = Readonly<{
  /** Primary line (e.g. "My School"). Omit all text lines for a header with actions only. */
  title?: string;
  /** Optional second line (e.g. section name). */
  subtitle?: string;
  /** Optional breadcrumb prefix shown before title (lighter). */
  eyebrow?: string;
  actionSlot?: ReactNode;
}>;

export function SchoolWorkspaceHeader({
  title,
  subtitle,
  eyebrow,
  actionSlot,
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
          <Button type="button" variant="primary" className="gap-2">
            <Plus className="size-4" aria-hidden />
            Add School
          </Button>
        )}
      </div>
    </header>
  );
}
