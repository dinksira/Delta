"use client";

/** ################################ IMPORT ############################# */
/** Imports used by this file. */
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Headphones, Home, Library } from "lucide-react";

import { Card, Typography } from "@/components/theme";
import { FeedExplorerShell } from "@/modules/Feed/views/FeedExplorerShell";

/** ################################ /IMPORT ############################# */
/** ################################ CONSTANTS ############################# */
/** Shared constants used by this file. */
const listenItems = [
  { title: "Quantum Mechanics", tone: "from-slate-400 to-slate-600" },
  { title: "Bio-Technology", tone: "from-emerald-400 to-teal-700" },
  { title: "Neural Interfaces", tone: "from-violet-400 to-indigo-700" },
  { title: "Lab Signals", tone: "from-amber-400 to-orange-600" },
  { title: "Deep Listening", tone: "from-sky-400 to-blue-700" },
  { title: "Field Recordings", tone: "from-rose-400 to-pink-700" },
] as const;

const focusRowA = [
  { title: "Today's Top Hits", sub: "Curated lab playlist", tone: "from-primary-400 to-primary-800" },
  { title: "All Out 2010s", sub: "Throwback research mix", tone: "from-slate-500 to-slate-800" },
  { title: "Chill Hits", sub: "Low-tempo focus", tone: "from-cyan-500 to-primary-700" },
  { title: "Destiny Rogers", sub: "Artist spotlight", tone: "from-fuchsia-500 to-purple-800" },
] as const;

const focusRowB = [
  { title: "Peaceful Piano", sub: "Instrumental study", tone: "from-slate-300 to-slate-600" },
  { title: "Deep Focus", sub: "Binaural-friendly", tone: "from-primary-300 to-primary-700" },
  { title: "Instrumental Study", sub: "No vocals", tone: "from-teal-400 to-primary-800" },
  { title: "Ambient Labs", sub: "Generative beds", tone: "from-indigo-400 to-slate-800" },
] as const;

/** ################################ /CONSTANTS ############################# */
/** ################################ SUBCOMPONENTS ############################# */
/** Local subcomponents used by the main export. */
function SectionHeader({
  title,
  href,
  id,
  icon: Icon,
}: Readonly<{ title: string; href: string; id?: string; icon?: LucideIcon }>) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-2">
        {Icon ? <Icon className="size-5 shrink-0 text-primary-600" aria-hidden /> : null}
        <Typography
          as="h2"
          variant="h2"
          id={id}
          className="text-xl font-semibold text-text-primary sm:text-2xl"
        >
          {title}
        </Typography>
      </div>
      <Link
        href={href}
        className="shrink-0 text-sm font-medium text-primary-600 hover:text-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40"
      >
        Show all
      </Link>
    </div>
  );
}

const hubScrollClass =
  "min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-y-contain py-2 sm:py-3";

/** ################################ /SUBCOMPONENTS ############################# */
/** ################################ COMPONENT ############################# */
/** Audio hub — same explorer shell as video landing (design-only body). */
export function AudioHubView() {
  return (
    <FeedExplorerShell
      expandMainToFullWidth
      leftFooter={
        <nav className="mt-4 flex flex-col gap-1 border-t border-border-default pt-4" aria-label="Audio navigation">
          <Link
            href="/"
            className="flex items-center gap-3 rounded-xl px-1 py-2 text-text-primary transition-colors hover:bg-surface-muted sm:px-2"
          >
            <Home className="size-5 shrink-0 text-text-secondary" aria-hidden />
            <Typography as="span" variant="label">
              Home
            </Typography>
          </Link>
          <span className="flex items-center gap-3 rounded-xl bg-surface-muted px-1 py-2 sm:px-2">
            <Library className="size-5 shrink-0 text-primary-600" aria-hidden />
            <Typography as="span" variant="label" className="font-semibold">
              Your Library
            </Typography>
          </span>
        </nav>
      }
      center={
        <div className={hubScrollClass}>
          <div className="min-w-0 w-full space-y-10 px-1 pb-10 sm:px-2">
            <section aria-labelledby="audio-listen-heading">
              <SectionHeader title="Listen" href="/audio" id="audio-listen-heading" />
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {listenItems.map((item) => (
                  <Card
                    key={item.title}
                    className="flex-row items-center gap-3 p-3 transition-colors hover:border-primary-300"
                  >
                    <div className={`size-14 shrink-0 rounded-lg bg-gradient-to-br ${item.tone}`} aria-hidden />
                    <Typography as="p" variant="label" className="min-w-0 font-semibold text-text-primary">
                      {item.title}
                    </Typography>
                  </Card>
                ))}
              </div>
            </section>

            <section aria-labelledby="audio-focus-1">
              <SectionHeader title="Focus" href="/audio" id="audio-focus-1" icon={Headphones} />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {focusRowA.map((item) => (
                  <Card
                    key={item.title}
                    className="gap-0 overflow-hidden p-0 transition-colors hover:border-primary-300"
                  >
                    <div className={`aspect-[4/3] w-full bg-gradient-to-br ${item.tone}`} aria-hidden />
                    <div className="space-y-1 p-4">
                      <Typography as="h3" variant="label" className="font-semibold text-text-primary">
                        {item.title}
                      </Typography>
                      <Typography variant="small" className="line-clamp-2 text-text-secondary">
                        {item.sub}
                      </Typography>
                    </div>
                  </Card>
                ))}
              </div>
            </section>

            <section aria-labelledby="audio-focus-2">
              <SectionHeader title="Focus" href="/audio" id="audio-focus-2" />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {focusRowB.map((item) => (
                  <Card
                    key={item.title}
                    className="gap-0 overflow-hidden p-0 transition-colors hover:border-primary-300"
                  >
                    <div className={`aspect-[4/3] w-full bg-gradient-to-br ${item.tone}`} aria-hidden />
                    <div className="space-y-1 p-4">
                      <Typography as="h3" variant="label" className="font-semibold text-text-primary">
                        {item.title}
                      </Typography>
                      <Typography variant="small" className="line-clamp-2 text-text-secondary">
                        {item.sub}
                      </Typography>
                    </div>
                  </Card>
                ))}
              </div>
            </section>
          </div>
        </div>
      }
    />
  );
}
/** ################################ /COMPONENT ############################# */
