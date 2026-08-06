/**
 * CompetitionWorkspaceTemplate
 * Atomic Level: Template
 *
 * Competition builder workspace shell per the Question Builder spec: a header
 * (back + icon + title/subtitle on the left, workspace actions + mode controls
 * on the right), a 3-column grid of left rail | center canvas | right settings
 * panel (~20% / 55% / 25%), and a shared bottom navigation bar with Previous
 * (left) and Next (right).
 *
 * @example
 * <CompetitionWorkspaceTemplate
 *   title="Question Builder"
 *   subtitle="Competition Workspace"
 *   headerIcon={Braces}
 *   onBack={backToPool}
 *   onPrevious={backToPool}
 *   onNext={advanceToReview}
 *   nextDisabled={!canGoNext}
 *   secondaryActions={<><Button variant="secondary" size="sm">Draft</Button><Button size="sm">Preview</Button></>}
 *   leftRail={<ModuleRail ... />}
 *   rightPanel={<ModuleSettingsPanel>...</ModuleSettingsPanel>}
 * >
 *   {canvas}
 * </CompetitionWorkspaceTemplate>
 */

import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { ArrowLeft, ArrowRight, Bot, Link2, Layers, Plug, UserPlus } from "lucide-react";

import { BackButton } from "@/components/theme/BackButton";
import { Button } from "@/components/theme/Button";
import { Typography } from "@/components/theme/Typography";
import { cn } from "@/lib/utils";

export interface CompetitionWorkspaceTemplateProps {
  title: string;
  subtitle: string;
  headerIcon?: LucideIcon;
  onBack?: () => void;
  /** Left-side (rail) column, e.g. ModuleRail. */
  leftRail?: ReactNode;
  /** Right-side (settings) column, e.g. ModuleSettingsPanel. */
  rightPanel?: ReactNode;
  /** Center canvas content (the active module UI). */
  children?: ReactNode;
  /** Right-aligned mode controls in the header (Draft / Preview). */
  secondaryActions?: ReactNode;
  /** Show Integrate/Automate/Invite utility links in the header. */
  showWorkspaceActions?: boolean;
  onPrevious?: () => void;
  onNext?: () => void;
  previousDisabled?: boolean;
  nextDisabled?: boolean;
  className?: string;
}

export function CompetitionWorkspaceTemplate({
  title,
  subtitle,
  headerIcon: HeaderIcon = Layers,
  onBack,
  leftRail,
  rightPanel,
  children,
  secondaryActions,
  showWorkspaceActions = true,
  onPrevious,
  onNext,
  previousDisabled = false,
  nextDisabled = false,
  className,
}: Readonly<CompetitionWorkspaceTemplateProps>) {
  return (
    <div
      className={cn(
        "flex h-full flex-col gap-6 overflow-y-auto px-4 py-6 md:px-8 md:py-8",
        className,
      )}
    >
      {/* Header: back + icon/title/subtitle (left) + utility actions (right) */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          {onBack && <BackButton label="Back" onClick={onBack} />}
          <HeaderIcon className="size-6 shrink-0 text-primary-700" aria-hidden />
          <div className="flex min-w-0 flex-col">
            <Typography as="h1" className="truncate text-xl font-bold text-text-primary md:text-2xl">
              {title}
            </Typography>
            <Typography className="text-xs font-medium text-text-secondary">
              {subtitle}
            </Typography>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {showWorkspaceActions && (
            <div className="hidden items-center gap-1 lg:flex">
              <button
                type="button"
                className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-muted hover:text-primary-700"
              >
                <Plug className="size-4" aria-hidden />
                Integrate
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-muted hover:text-primary-700"
              >
                <Bot className="size-4" aria-hidden />
                Automate
              </button>
              <div className="mx-2 h-5 w-px bg-border-default" aria-hidden />
              <button
                type="button"
                className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-muted hover:text-primary-700"
              >
                <UserPlus className="size-4" aria-hidden />
                Invite
                <Link2 className="size-3.5" aria-hidden />
              </button>
            </div>
          )}

          {secondaryActions && (
            <>
              <div className="hidden h-5 w-px bg-border-default lg:block" aria-hidden />
              <div className="flex items-center gap-2">{secondaryActions}</div>
            </>
          )}
        </div>
      </div>

      {/* 3-column workspace grid */}
      <div className="flex flex-1 flex-col gap-6 lg:flex-row">
        {leftRail}
        <main className="min-w-0 flex-1 rounded-xl border border-border-default bg-surface-default p-4 shadow-sm md:p-6">
          {children}
        </main>
        {rightPanel}
      </div>

      {/* Bottom navigation bar */}
      <div className="flex items-center justify-between">
        <Button
          variant="secondary"
          onClick={onPrevious}
          disabled={previousDisabled || !onPrevious}
          className="h-auto rounded-lg px-6 py-2.5"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Previous
        </Button>
        <Button
          variant="primary"
          onClick={onNext}
          disabled={nextDisabled || !onNext}
          className="h-auto rounded-lg bg-primary-700 px-8 py-2.5 hover:bg-primary-800"
        >
          Next
          <ArrowRight className="size-4" aria-hidden />
        </Button>
      </div>
    </div>
  );
}

export default CompetitionWorkspaceTemplate;