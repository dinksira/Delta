/** ################################ COMPONENT ############################# */
/**
 * HireTutorLayout
 * Two-column shell for the Hire a Tutor form.
 *
 * Presentational only: it takes both columns as nodes, so the state lives in
 * {@link useHireTutorForm} at the call site rather than here.
 *
 * @example
 * ```tsx
 * <HireTutorLayout
 *   descriptionSection={<DescriptionSection {...left} />}
 *   estimationSection={<EstimationPaymentSection {...right} />}
 *   footer={<Button size="lg">Request tutor</Button>}
 * />
 * ```
 */

/** ################################ IMPORT ############################# */
/** React core and local building blocks. */
import React from "react";

import { cn } from "@/lib/utils";
import type { HireTutorLayoutProps } from "./types";
import {
  footerClasses,
  gridClasses,
  layoutClasses,
  layoutInnerClasses,
  titleClasses,
} from "./variants";
/** ################################ /IMPORT ############################# */

/** The shell. */
export function HireTutorLayout({
  title = "Hire a tutor",
  description,
  descriptionSection,
  estimationSection,
  footer,
  className,
}: Readonly<HireTutorLayoutProps>) {
  return (
    <div className={cn(layoutClasses, className)}>
      <div className={layoutInnerClasses}>
        <h2 className={titleClasses}>{title}</h2>
        {description ? <p className="mb-6 text-sm text-text-secondary">{description}</p> : null}

        <div className={gridClasses}>
          {descriptionSection}
          {estimationSection}
        </div>

        {footer ? <div className={footerClasses}>{footer}</div> : null}
      </div>
    </div>
  );
}

HireTutorLayout.displayName = "HireTutorLayout";
/** ################################ /COMPONENT ############################# */
