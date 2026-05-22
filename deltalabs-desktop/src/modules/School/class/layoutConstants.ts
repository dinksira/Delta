/**
 * Layout tokens for the **Class workspace** content (width matches school detail via shell only).
 */
export const CLASS_WORKSPACE_LAYOUT = {
  /**
   * Top inset for school workspace routes. Matches {@link ClassWorkspaceRouteLayout} (`py-2` /
   * `md:py-3` before bottom padding is overridden for the class bottom nav).
   */
  routeBodyTopPadding: "pt-2 md:pt-3",
  /** Class title (mock: large bold “Class A”). */
  titleClass:
    "break-words text-[2.25rem] font-semibold leading-[1.15] tracking-tight text-text-primary sm:text-[2.35rem] md:text-[2.45rem]",
  /** Page header class name — smaller than `titleClass` for the top bar row. */
  pageHeaderTitleClass:
    "break-words text-lg font-semibold leading-snug tracking-tight text-text-primary sm:text-xl md:text-2xl",
  /** “Class Session” — mock: boxed horizontal bar; title left, action right (wraps on narrow screens). */
  sectionBar:
    "flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border-default bg-surface-muted/40 px-4 py-3.5 sm:gap-4 sm:px-5 sm:py-4",
  sectionTitle: "text-base font-bold text-text-primary sm:text-[1.05rem]",
  /** Session cards — mock card radius and soft shadow. */
  sessionCard:
    "flex min-h-[220px] flex-col rounded-[0.9rem] border border-border-default bg-surface-default px-5 py-4 shadow-[0_1px_2px_rgba(2,24,43,0.06)] sm:px-6 sm:py-5",
} as const;
