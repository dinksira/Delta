"use client";

import { useSearchParams } from "next/navigation";

import { Card, CardDescription, CardHeader, CardTitle, Typography } from "@/components/theme";
import { useFeatureTabs } from "@/contexts/FeatureTabs_Context";

const featureCards = [
  { title: "School", description: "Studio-quality text-to-speech with emotional nuance and support for over 140+ languages." },
  { title: "Course", description: "Studio-quality text-to-speech with emotional nuance and support for over 140+ languages." },
  { title: "Online Competition", description: "Studio-quality text-to-speech with emotional nuance and support for over 140+ languages." },
  { title: "Tutorial", description: "Studio-quality text-to-speech with emotional nuance and support for over 140+ languages." },
  { title: "R&D", description: "Studio-quality text-to-speech with emotional nuance and support for over 140+ languages." },
  { title: "Laboratory", description: "Studio-quality text-to-speech with emotional nuance and support for over 140+ languages." },
  { title: "Certification", description: "Studio-quality text-to-speech with emotional nuance and support for over 140+ languages." },
  { title: "Chatroom", description: "Studio-quality text-to-speech with emotional nuance and support for over 140+ languages." },
] as const;

/** Authorized-only features screen: grid opens browser-style workspace tabs in the top nav. */
export function FeaturesPageView() {
  const { openWorkspaceTab, openTabs } = useFeatureTabs();
  const searchParams = useSearchParams();
  const activeWorkspace = searchParams.get("tab");
  const activeLabel =
    activeWorkspace && openTabs.find((t) => t.param === activeWorkspace)?.label;

  return (
    <div className="flex flex-col gap-8 py-4">
      <div className="flex items-center justify-between">
        <div className="inline-flex rounded-xl border border-features-card-border bg-features-card-icon-bg px-5 py-2">
          <Typography as="span" variant="label">
            Features
          </Typography>
        </div>
      </div>

      <section className="space-y-2 text-center">
        <Typography as="h1" variant="h1">
          Learn. Build. Experiment.
        </Typography>
        <Typography variant="body" className="text-text-secondary">
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

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {featureCards.map((card) => (
          <Card
            key={card.title}
            role="button"
            tabIndex={0}
            className="h-full cursor-pointer border-features-card-border bg-features-card-surface transition-colors hover:border-features-card-hover-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40"
            onClick={() => openWorkspaceTab(card.title)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                openWorkspaceTab(card.title);
              }
            }}
          >
            <CardHeader>
              <CardTitle>{card.title}</CardTitle>
              <CardDescription>{card.description}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </section>
    </div>
  );
}
