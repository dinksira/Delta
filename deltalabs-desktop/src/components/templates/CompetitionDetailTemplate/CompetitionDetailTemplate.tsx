/**
 * CompetitionDetailTemplate
 * Single-column scrollable page composing all competition detail sections.
 */

import type { ReactNode } from "react";

import { PageHeader } from "@/components/organisms/PageHeader/PageHeader";
import type { ActionButton } from "@/components/organisms/PageHeader/PageHeader";
import { HeroBanner } from "@/components/organisms/HeroBanner/HeroBanner";
import { OverviewSection } from "@/components/organisms/OverviewSection/OverviewSection";
import { PrizeDetailsSection } from "@/components/organisms/PrizeDetailsSection/PrizeDetailsSection";
import type { PrizeItem } from "@/components/organisms/PrizeDetailsSection/PrizeDetailsSection";
import { CompetitionTimeline } from "@/components/organisms/CompetitionTimeline/CompetitionTimeline";
import type { TimelineItem } from "@/components/organisms/CompetitionTimeline/CompetitionTimeline";
import { cn } from "@/lib/utils";

// ============================================================================
// PROPS
// ============================================================================

export interface CompetitionDetailTemplateProps {
  title: string;
  headerActions?: ActionButton[];
  headerRightSlot?: ReactNode;
  onBack?: () => void;

  bannerImageUrl: string;
  heroTitle: string;
  heroSubtitle: string;
  deadline: string;

  overview: string;

  prizes: PrizeItem[];

  timeline: TimelineItem[];

  className?: string;
}

// ============================================================================
// TEMPLATE
// ============================================================================

export function CompetitionDetailTemplate({
  title,
  headerActions,
  headerRightSlot,
  onBack,

  bannerImageUrl,
  heroTitle,
  heroSubtitle,
  deadline,

  overview,

  prizes,

  timeline,

  className,
}: Readonly<CompetitionDetailTemplateProps>) {
  return (
    <div className={cn("flex h-full flex-col gap-6 overflow-y-auto", className)}>
      {/* Page Header */}
      <PageHeader
        title={title}
        actions={headerActions}
        onBack={onBack}
        rightSlot={headerRightSlot}
      />

      {/* Hero Banner */}
      <HeroBanner
        bannerImageUrl={bannerImageUrl}
        heroTitle={heroTitle}
        heroSubtitle={heroSubtitle}
        deadline={deadline}
      />

      {/* Overview */}
      <OverviewSection text={overview} />

      {/* Prize Details */}
      <PrizeDetailsSection prizes={prizes} />

      {/* Competition Timeline */}
      <CompetitionTimeline steps={timeline} />
    </div>
  );
}

export default CompetitionDetailTemplate;
