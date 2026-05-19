"use client";

/** ################################ IMPORT ############################# */
/** Imports used by this file. */
import Link from "next/link";
import { ArrowRight, Boxes, Cpu, Mic2, Sparkles, Video } from "lucide-react";

import { Card, Typography } from "@/components/theme";
import { FeedExplorerShell } from "@/modules/Feed/views/FeedExplorerShell";

/** ################################ /IMPORT ############################# */
/** ################################ CONSTANTS ############################# */
/** Shared constants used by this file. */
const hubs = [
  {
    href: "/",
    title: "Video",
    description: "Full-screen discovery feed and clip playback.",
    icon: Video,
    tone: "from-slate-600 to-slate-900",
  },
  {
    href: "/audio",
    title: "Audio",
    description: "Listen rows, focus playlists, and library entry points.",
    icon: Mic2,
    tone: "from-primary-500 to-primary-900",
  },
  {
    href: "/ai",
    title: "AI",
    description: "Featured models, filters, and recent activity.",
    icon: Sparkles,
    tone: "from-violet-500 to-indigo-900",
  },
  {
    href: "/simulation",
    title: "Simulation",
    description: "Scenarios, digital twins, and batch run shells.",
    icon: Cpu,
    tone: "from-teal-500 to-emerald-900",
  },
] as const;

const hubScrollClass =
  "min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-y-contain py-2 sm:py-3";

/** ################################ /CONSTANTS ############################# */
/** ################################ COMPONENT ############################# */
/** “All” hub — same explorer shell as video; module tiles in the center column. */
export function ExploreAllView() {
  return (
    <FeedExplorerShell
      center={
        <div className={hubScrollClass}>
          <div className="mx-auto min-w-0 max-w-5xl px-1 pb-10 sm:px-2">
            <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 text-text-secondary">
                  <Boxes className="size-5" aria-hidden />
                  <Typography variant="small" className="font-medium uppercase tracking-wide">
                    Explorer
                  </Typography>
                </div>
                <Typography as="h1" variant="h1">
                  All modules
                </Typography>
                <Typography variant="body" className="max-w-2xl text-text-secondary">
                  Browse Delta Labs surfaces. These routes are design shells only for now—wire-up comes later.
                </Typography>
              </div>
            </div>

            <ul className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {hubs.map((hub) => {
                const Icon = hub.icon;
                return (
                  <li key={hub.href}>
                    <Link href={hub.href} className="group block h-full focus-visible:outline-none">
                      <Card className="h-full gap-4 p-5 transition-colors group-hover:border-primary-300 group-focus-visible:ring-2 group-focus-visible:ring-primary-500/40">
                        <div className="flex items-start gap-4">
                          <div
                            className={`flex size-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white ${hub.tone}`}
                            aria-hidden
                          >
                            <Icon className="size-6" />
                          </div>
                          <div className="min-w-0 space-y-1">
                            <Typography as="h2" variant="h3">
                              {hub.title}
                            </Typography>
                            <Typography variant="small" className="text-text-secondary">
                              {hub.description}
                            </Typography>
                          </div>
                        </div>
                        <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary-600 group-hover:text-primary-700">
                          Open
                          <ArrowRight
                            className="size-4 transition-transform group-hover:translate-x-0.5"
                            aria-hidden
                          />
                        </span>
                      </Card>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      }
    />
  );
}
/** ################################ /COMPONENT ############################# */
