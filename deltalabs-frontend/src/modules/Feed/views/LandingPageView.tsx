"use client";

import { useRef, useState } from "react";

import {
  CreatorIdentity,
  FeedActionRail,
  FeedCaption,
  FeedFilterPanel,
  FeedHashtagList,
  FeedResourceLink,
  FeedSearchInput,
  FeedSnapScrollControls,
  FeedViewport,
  type FeedActionItem,
} from "@/components/features/feed";

const actionRailTemplate = [
  {
    key: "goToCourse",
    actionLabel: "Go to Course",
    metaLabel: "Go to\nCourse",
  },
  { key: "like", actionLabel: "Like", metaLabel: "42.8K" },
  { key: "comment", actionLabel: "Comment", metaLabel: "1,204" },
  { key: "bookmark", actionLabel: "Bookmark", metaLabel: "8.4K" },
  { key: "share", actionLabel: "Share", metaLabel: "Share" },
  { key: "profile", actionLabel: "Profile", metaLabel: "", profileInitials: "EV" },
] as const satisfies readonly FeedActionItem[];

type LandingClip = Readonly<{
  id: string;
  mediaTone: number;
  caption: string;
  hashtags: readonly string[];
  pdfLabel: string;
  /** Optional per-clip like count label */
  likeCount?: string;
}>;

const LANDING_CLIPS: readonly LandingClip[] = [
  {
    id: "c1",
    mediaTone: 0,
    caption: "Analyzing the neural pathways of synthetically grown bio-neural chips.",
    hashtags: ["NeuroTech", "FutureTech", "DeltaLabs"],
    pdfLabel: "Access Full Research Paper (PDF)",
  },
  {
    id: "c2",
    mediaTone: 1,
    caption: "Lab notes: closed-loop stimulation protocols on organoid arrays.",
    hashtags: ["BioEng", "Research", "DeltaLabs"],
    pdfLabel: "View lab summary (PDF)",
    likeCount: "38.2K",
  },
  {
    id: "c3",
    mediaTone: 2,
    caption: "Dataset walkthrough — multimodal sensing fusion for edge devices.",
    hashtags: ["EdgeAI", "Sensors", "DeltaLabs"],
    pdfLabel: "Download dataset card (PDF)",
    likeCount: "51.1K",
  },
  {
    id: "c4",
    mediaTone: 3,
    caption: "Simulation run #482: failure modes in redundant actuator meshes.",
    hashtags: ["Simulation", "Robotics", "DeltaLabs"],
    pdfLabel: "Open simulation report (PDF)",
    likeCount: "19.4K",
  },
  {
    id: "c5",
    mediaTone: 4,
    caption: "Short brief on ethics review for autonomous lab assistants.",
    hashtags: ["Policy", "AI", "DeltaLabs"],
    pdfLabel: "Read ethics brief (PDF)",
    likeCount: "8.9K",
  },
  {
    id: "c6",
    mediaTone: 5,
    caption: "Field test highlights — low-latency streaming from remote sites.",
    hashtags: ["Streaming", "FieldTest", "DeltaLabs"],
    pdfLabel: "Field test appendix (PDF)",
    likeCount: "27.8K",
  },
];

function buildRailForClip(clip: LandingClip): readonly FeedActionItem[] {
  return actionRailTemplate.map((item) =>
    item.key === "like" && clip.likeCount
      ? { ...item, metaLabel: clip.likeCount }
      : { ...item },
  );
}

function LandingClipSlide({ clip }: Readonly<{ clip: LandingClip }>) {
  const [activeActionKey, setActiveActionKey] = useState<string | null>(null);
  const railItems = buildRailForClip(clip);

  return (
    <div
      className="flex min-h-full w-full shrink-0 snap-start snap-always items-center justify-center py-4"
      data-feed-slide=""
    >
      <div className="flex w-full max-w-full flex-col items-center gap-4 sm:w-auto sm:flex-row sm:items-end sm:gap-1.5">
        <div className="w-full max-w-[420px] shrink-0 sm:w-[420px]">
          <FeedViewport mediaTone={clip.mediaTone}>
            <CreatorIdentity initials="EV" name="Dr. Elena Vance" handle="@elena_v_labs" />
            <FeedCaption text={clip.caption} />
            <FeedHashtagList hashtags={[...clip.hashtags]} />
            <FeedResourceLink text={clip.pdfLabel} />
          </FeedViewport>
        </div>

        <FeedActionRail
          items={railItems}
          activeActionKey={activeActionKey}
          onActionToggle={(key) => setActiveActionKey((prev) => (prev === key ? null : key))}
        />
      </div>
    </div>
  );
}

/** Public landing feed-style layout aligned to design parity target. */
export function LandingPageView() {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const filterPanelId = "landing-feed-filter-panel";
  const feedScrollRef = useRef<HTMLDivElement>(null);

  return (
    <section className="flex min-h-0 w-full min-w-0 flex-1 flex-col overflow-hidden px-2 md:px-3">
      <div className="grid min-h-0 min-w-0 flex-1 grid-cols-1 grid-rows-[auto_minmax(0,1fr)] gap-5 overflow-hidden lg:grid-cols-[1fr_auto_1fr] lg:grid-rows-[minmax(0,1fr)] lg:items-stretch lg:gap-4">
        <aside className="w-full max-w-[280px] justify-self-start pt-5 lg:sticky lg:top-0 lg:z-10 lg:self-start">
          <FeedSearchInput
            filterControlsId={filterPanelId}
            isFilterOpen={isFilterOpen}
            onFilterToggle={() => setIsFilterOpen((value) => !value)}
          />
          <FeedFilterPanel id={filterPanelId} isOpen={isFilterOpen} />
        </aside>

        <div className="flex h-full min-h-0 min-w-0 w-full flex-col overflow-hidden lg:w-auto lg:justify-self-center">
          <div
            ref={feedScrollRef}
            role="feed"
            aria-label="Video feed"
            tabIndex={0}
            className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-y-contain [-webkit-overflow-scrolling:touch] snap-y snap-mandatory [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {LANDING_CLIPS.map((clip) => (
              <LandingClipSlide key={clip.id} clip={clip} />
            ))}
          </div>
        </div>

        <div className="hidden min-w-0 lg:block" aria-hidden />
      </div>

      <FeedSnapScrollControls scrollContainerRef={feedScrollRef} />
    </section>
  );
}
