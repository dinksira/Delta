"use client";

import { useSearchParams } from "next/navigation";

import { Button, Card, CardFooter, Typography } from "@/components/theme";
import { useFeatureTabs } from "@/contexts/FeatureTabs_Context";
import {
  CalendarDays,
  Boxes,
  Dna,
  UserRound,
  Layers,
  FlaskConical,
} from "lucide-react";

const featureCards = [
  {
    title: "School",
    linkLabel: "Enter School",
    icon: CalendarDays,
    chipClass: "bg-[color:var(--color-features-chip-slate-bg)] text-[color:var(--color-features-chip-slate-fg)]",
  },
  {
    title: "Course",
    linkLabel: "Enter Course",
    icon: Boxes,
    chipClass: "bg-[color:var(--color-features-chip-orange-bg)] text-[color:var(--color-features-chip-orange-fg)]",
  },
  {
    title: "Online Competition",
    linkLabel: "Enter Online Competition",
    icon: Dna,
    chipClass: "bg-[color:var(--color-features-chip-indigo-bg)] text-[color:var(--color-features-chip-indigo-fg)]",
  },
  {
    title: "Tutorial",
    linkLabel: "Enter Tutorial",
    icon: UserRound,
    chipClass: "bg-[color:var(--color-features-chip-emerald-bg)] text-[color:var(--color-features-chip-emerald-fg)]",
  },
  {
    title: "R&D",
    linkLabel: "Enter R&D",
    icon: Layers,
    chipClass: "bg-[color:var(--color-features-chip-amber-bg)] text-[color:var(--color-features-chip-amber-fg)]",
  },
  {
    title: "Laboratory",
    linkLabel: "Enter Laboratory",
    icon: FlaskConical,
    chipClass: "bg-[color:var(--color-features-chip-rose-bg)] text-[color:var(--color-features-chip-rose-fg)]",
  },
  {
    title: "Certification",
    linkLabel: "Enter Certification",
    icon: CalendarDays,
    chipClass: "bg-[color:var(--color-features-chip-cyan-bg)] text-[color:var(--color-features-chip-cyan-fg)]",
  },
  {
    title: "Chatroom",
    linkLabel: "Enter Chatroom",
    icon: Boxes,
    chipClass: "bg-[color:var(--color-features-chip-teal-bg)] text-[color:var(--color-features-chip-teal-fg)]",
  },
] as const;

/** Authorized-only features screen: grid opens browser-style workspace tabs in the top nav. */
export function FeaturesPageView() {
  const { openWorkspaceTab, openTabs } = useFeatureTabs();
  const searchParams = useSearchParams();
  const activeWorkspace = searchParams.get("tab");
  const activeLabel =
    activeWorkspace && openTabs.find((t) => t.param === activeWorkspace)?.label;

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
        {featureCards.map((card) => (
          <Card
            key={card.title}
            role="button"
            tabIndex={0}
            className="min-h-[178px] gap-3 rounded-2xl border-features-card-border bg-features-card-surface px-4 py-3 shadow-sm transition-colors hover:border-features-card-hover-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40"
            onClick={() => openWorkspaceTab(card.title)}
            onKeyDown={(e) => {
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
              Studio-quality text-to-speech with emotional nuance and support for over 140+ languages.
            </Typography>
            <CardFooter className="mt-auto border-t border-border-default pt-3">
              <Button
                variant="ghost"
                size="sm"
                className="h-auto px-0 py-0 text-xs font-medium text-secondary-500 hover:bg-transparent hover:underline"
                onClick={(e) => {
                  e.stopPropagation();
                  openWorkspaceTab(card.title);
                }}
              >
                {card.linkLabel}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </section>
    </div>
  );
}
