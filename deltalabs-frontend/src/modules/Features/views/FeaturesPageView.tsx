"use client";

/** ################################ IMPORT ############################# */
/** Imports used by this file. */
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

import { Card, Typography } from "@/components/theme";
import { useAuthSession } from "@/contexts/AuthSession_Context";
import { useFeatureTabs } from "@/contexts/FeatureTabs_Context";
import { fetchFeaturesList } from "@/modules/Features/api";
import {
/** ################################ /IMPORT ############################# */

/** ################################ COMPONENT ############################# */
/** Main exported component logic for this file. */
  CalendarDays,
  CalendarClock,
  Boxes,
  Dna,
  UserRound,
  Layers,
  FlaskConical,
  GraduationCap,
} from "lucide-react";

const defaultFeatureCatalog = [
  {
    featureKey: "school",
    title: "School",
    icon: CalendarDays,
    description: "Manage schools, staff, and academic structure.",
    chipClass: "bg-[color:var(--color-features-chip-slate-bg)] text-[color:var(--color-features-chip-slate-fg)]",
  },
  {
    featureKey: "course",
    title: "Course",
    icon: Boxes,
    description: "Courses, curriculum, and learner progress.",
    chipClass: "bg-[color:var(--color-features-chip-orange-bg)] text-[color:var(--color-features-chip-orange-fg)]",
  },
  {
    featureKey: "competitions",
    title: "Online Competition",
    icon: Dna,
    description: "Host and join practical competitions with measurable outcomes.",
    chipClass: "bg-[color:var(--color-features-chip-indigo-bg)] text-[color:var(--color-features-chip-indigo-fg)]",
  },
  {
    featureKey: "tutorials",
    title: "Tutorial",
    icon: UserRound,
    description: "Guided tutorials and structured practice paths.",
    chipClass: "bg-[color:var(--color-features-chip-emerald-bg)] text-[color:var(--color-features-chip-emerald-fg)]",
  },
  {
    featureKey: "research",
    title: "R&D",
    icon: Layers,
    description: "Collaborative research workspace and experiment tracking.",
    chipClass: "bg-[color:var(--color-features-chip-amber-bg)] text-[color:var(--color-features-chip-amber-fg)]",
  },
  {
    featureKey: "rent_lab",
    title: "Laboratory",
    icon: FlaskConical,
    description: "Laboratory usage, booking, and operational coordination.",
    chipClass: "bg-[color:var(--color-features-chip-rose-bg)] text-[color:var(--color-features-chip-rose-fg)]",
  },
  {
    featureKey: "certification",
    title: "Certification",
    icon: CalendarDays,
    description: "Issue, track, and verify learning certifications.",
    chipClass: "bg-[color:var(--color-features-chip-cyan-bg)] text-[color:var(--color-features-chip-cyan-fg)]",
  },
  {
    featureKey: "chatroom",
    title: "Chatroom",
    icon: Boxes,
    description: "Real-time group conversations and classroom communication.",
    chipClass: "bg-[color:var(--color-features-chip-teal-bg)] text-[color:var(--color-features-chip-teal-fg)]",
  },
  {
    featureKey: "planner",
    title: "Planner",
    icon: CalendarClock,
    description: "Plan tasks, schedules, and academic milestones.",
    chipClass: "bg-[color:var(--color-features-chip-violet-bg)] text-[color:var(--color-features-chip-violet-fg)]",
  },
  {
    featureKey: "specialization",
    title: "Specialization",
    icon: GraduationCap,
    description: "Advanced specialization tracks for focused learning.",
    chipClass: "bg-[color:var(--color-features-chip-fuchsia-bg)] text-[color:var(--color-features-chip-fuchsia-fg)]",
  },
] as const;

const iconByFeatureKey = {
  school: CalendarDays,
  course: Boxes,
  competitions: Dna,
  tutorials: UserRound,
  research: Layers,
  rent_lab: FlaskConical,
  certification: CalendarDays,
  chatroom: Boxes,
  planner: CalendarClock,
  specialization: GraduationCap,
} as const;

/** Authorized-only features screen: grid opens browser-style workspace tabs in the top nav. */
export function FeaturesPageView() {
  const { isAuthenticated, isReady } = useAuthSession();
  const { openWorkspaceTab, openTabs } = useFeatureTabs();
  const searchParams = useSearchParams();
  const { data: featureData } = useQuery({
    queryKey: ["features", "list"],
    queryFn: fetchFeaturesList,
    enabled: isReady && isAuthenticated,
    staleTime: 60_000,
    retry: false,
  });
  const activeWorkspace = searchParams.get("tab");
  const activeLabel =
    activeWorkspace && openTabs.find((t) => t.param === activeWorkspace)?.label;
  const backendByKey = new Map(
    (featureData?.items ?? [])
      .filter((item) => typeof item.featureKey === "string" && item.featureKey.length > 0)
      .map((item) => [item.featureKey.toLowerCase(), item]),
  );
  const cards = defaultFeatureCatalog.map((feature, index) => {
    const backend = backendByKey.get(feature.featureKey);
    const canAccess = Boolean(backend?.enabled) && Boolean(backend?.capabilities?.canView);
    const backendTitle =
      typeof backend?.title === "string" && backend.title.trim().length > 0 ? backend.title : null;
    const backendDescription =
      typeof backend?.description === "string" && backend.description.trim().length > 0
        ? backend.description
        : null;
    const title = backendTitle ?? feature.title;
    return {
      id: feature.featureKey || `feature-${index}`,
      title,
      linkLabel: canAccess ? `Enter ${title}` : "Not available",
      icon: feature.icon ?? iconByFeatureKey[feature.featureKey as keyof typeof iconByFeatureKey] ?? CalendarDays,
      chipClass: feature.chipClass,
      disabled: !canAccess,
      description: backendDescription ?? feature.description,
    };
  });

  return (
    <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-8 pb-6 pt-8 sm:pt-10">
      <section className="mx-auto max-w-3xl space-y-2 text-center">
        <Typography as="h1" className="text-5xl font-semibold leading-[1.06] tracking-[-0.02em] text-primary-600 sm:text-6xl">
          Learn. Build. Experiment.
        </Typography>
        <Typography className="mx-auto max-w-2xl text-base leading-[1.45] text-slate-500 sm:text-[18px]">
          Access high-fidelity academic tools, collaborative research spaces, and a global network
          of specialized teams.
        </Typography>
      </section>

      {activeWorkspace ? (
        <section
          className="rounded-xl border border-features-card-border bg-features-card-surface px-4 py-6 text-center"
          aria-live="polite"
        >
          <Typography as="h2" variant="h2" className="text-lg sm:text-xl">
            {activeLabel ??
              activeWorkspace.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
          </Typography>
          <Typography variant="body" className="mt-2 text-text-secondary">
            Workspace view for this tab will load here when the module is connected.
          </Typography>
        </section>
      ) : null}

      <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card, index) => (
          <Card
            key={"id" in card ? card.id : `${card.title}-${index}`}
            role="button"
            tabIndex={0}
            aria-label={card.linkLabel}
            className="min-h-[178px] gap-3 rounded-2xl border-features-card-border bg-features-card-surface px-4 py-3 shadow-sm transition-colors hover:border-features-card-hover-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40"
            onClick={() => {
              if ("disabled" in card && card.disabled) return;
              openWorkspaceTab(card.title);
            }}
            onKeyDown={(e) => {
              if ("disabled" in card && card.disabled) return;
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                openWorkspaceTab(card.title);
              }
            }}
          >
            <div className={`inline-flex size-10 items-center justify-center rounded-full ${card.chipClass}`} aria-hidden>
              <card.icon className="size-6" />
            </div>
            <Typography as="h3" className="text-[29px] font-semibold leading-tight text-primary-600">
              {card.title}
            </Typography>
            <Typography className="line-clamp-2 text-xs leading-[1.35] text-text-secondary">
              {"description" in card
                ? card.description
                : "Studio-quality text-to-speech with emotional nuance and support for over 140+ languages."}
            </Typography>
            <Typography
              as="p"
              variant="small"
              className="mt-auto pt-2 text-xs font-medium text-secondary-500"
              aria-hidden
            >
              {card.linkLabel}
            </Typography>
          </Card>
        ))}
      </section>
    </div>
  );
}
/** ################################ /COMPONENT ############################# */
