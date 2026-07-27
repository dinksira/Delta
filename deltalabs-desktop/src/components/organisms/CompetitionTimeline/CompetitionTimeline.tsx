/**
 * CompetitionTimeline
 * Section heading with hourglass icon + vertical timeline of TimelineSteps.
 */

import { Hourglass } from "lucide-react";

import { TimelineStep } from "@/components/molecules/TimelineStep/TimelineStep";
import { cn } from "@/lib/utils";

export interface TimelineItem {
  title: string;
  dateRange: string;
  description: string;
}

export interface CompetitionTimelineProps {
  steps: TimelineItem[];
  className?: string;
}

export function CompetitionTimeline({
  steps,
  className,
}: Readonly<CompetitionTimelineProps>) {
  return (
    <section className={cn("space-y-4", className)}>
      <h3 className="flex items-center gap-2 text-lg font-semibold text-text-primary">
        <Hourglass className="size-5 text-primary-600" aria-hidden />
        Competition Timeline
      </h3>
      <div className="pl-1">
        {steps.map((step, index) => (
          <TimelineStep
            key={index}
            title={step.title}
            dateRange={step.dateRange}
            description={step.description}
            isLast={index === steps.length - 1}
          />
        ))}
      </div>
    </section>
  );
}
