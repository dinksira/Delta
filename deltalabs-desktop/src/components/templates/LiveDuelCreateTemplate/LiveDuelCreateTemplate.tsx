/**
 * LiveDuelCreateTemplate — slim page layout for creating a Live Duel. Renders a
 * back + brand header with an optional subtitle, then a scrollable content
 * region for the host setup form and its lobby preview.
 *
 * @example
 * ```tsx
 * <LiveDuelCreateTemplate onBack={handleBack} subtitle="Host your own room">
 *   <LiveDuelCreateForm hostName="You" onSubmit={handleGoLive} />
 * </LiveDuelCreateTemplate>
 * ```
 */

import type { ReactNode } from "react";

import { Radio } from "lucide-react";

import { BackButton } from "@/components/theme/BackButton";
import { Typography } from "@/components/theme/Typography";
import { cn } from "@/lib/utils";

export interface LiveDuelCreateTemplateProps {
  onBack?: () => void;
  title?: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
}

export function LiveDuelCreateTemplate({
  onBack,
  title = "Create Live Duel",
  subtitle,
  children,
  className,
}: Readonly<LiveDuelCreateTemplateProps>) {
  return (
    <div className={cn("flex h-full flex-col gap-5 overflow-y-auto p-4 md:p-6", className)}>
      <div className="flex flex-wrap items-center gap-3">
        {onBack && <BackButton label="" onClick={onBack} />}
        <Radio className="size-6 shrink-0 text-primary-600" aria-hidden />
        <div className="min-w-0">
          <Typography as="h1" className="text-2xl font-semibold text-primary-600">
            {title}
          </Typography>
          {subtitle ? (
            <Typography className="text-sm text-text-secondary">{subtitle}</Typography>
          ) : null}
        </div>
      </div>

      <section className="mx-auto w-full max-w-5xl">{children}</section>
    </div>
  );
}

export default LiveDuelCreateTemplate;