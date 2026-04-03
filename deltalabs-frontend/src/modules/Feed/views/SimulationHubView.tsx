"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { Box, Cpu, Home, PlayCircle, Rows3 } from "lucide-react";

import { Card, Typography } from "@/components/theme";
import { FeedExplorerShell } from "@/modules/Feed/views/FeedExplorerShell";

const scenarios = [
  { title: "Wind tunnel A", tone: "from-sky-500 to-blue-900" },
  { title: "Traffic mesh", tone: "from-emerald-500 to-teal-900" },
  { title: "Protein fold", tone: "from-fuchsia-500 to-purple-900" },
  { title: "Climate cell", tone: "from-amber-500 to-orange-900" },
  { title: "Supply chain", tone: "from-slate-500 to-slate-800" },
  { title: "Battery stress", tone: "from-rose-500 to-red-900" },
] as const;

const twinRow = [
  { title: "Factory floor twin", sub: "Live telemetry + replay", tone: "from-primary-500 to-primary-900" },
  { title: "City mobility", sub: "Agent-based traffic", tone: "from-cyan-500 to-slate-800" },
  { title: "Orbital debris", sub: "Monte Carlo risk", tone: "from-indigo-500 to-slate-900" },
  { title: "Fluid cavity", sub: "High-fidelity CFD stub", tone: "from-teal-500 to-emerald-900" },
] as const;

const batchRow = [
  { title: "Parameter sweep", sub: "512 runs queued", tone: "from-violet-400 to-indigo-800" },
  { title: "Sensitivity study", sub: "Sobol indices", tone: "from-slate-400 to-slate-700" },
  { title: "Calibration pack", sub: "Bayesian fit", tone: "from-orange-400 to-amber-800" },
  { title: "Replay bundle", sub: "Deterministic seeds", tone: "from-pink-400 to-rose-800" },
] as const;

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

/** Simulation hub — shared feed explorer shell (design-only body). */
export function SimulationHubView() {
  return (
    <FeedExplorerShell
      leftFooter={
        <nav
          className="mt-4 flex flex-col gap-1 border-t border-border-default pt-4"
          aria-label="Simulation navigation"
        >
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
            <PlayCircle className="size-5 shrink-0 text-primary-600" aria-hidden />
            <Typography as="span" variant="label" className="font-semibold">
              Recent runs
            </Typography>
          </span>
          <span className="flex items-center gap-3 rounded-xl px-1 py-2 text-text-secondary sm:px-2">
            <Rows3 className="size-5 shrink-0" aria-hidden />
            <Typography as="span" variant="label">
              Templates
            </Typography>
          </span>
        </nav>
      }
      center={
        <div className={hubScrollClass}>
          <div className="mx-auto min-w-0 max-w-5xl space-y-10 px-1 pb-10 sm:px-2">
            <section aria-labelledby="sim-scenarios-heading">
              <SectionHeader title="Scenarios" href="/simulation" id="sim-scenarios-heading" icon={Box} />
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {scenarios.map((item) => (
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

            <section aria-labelledby="sim-twin-heading">
              <SectionHeader title="Digital twin" href="/simulation" id="sim-twin-heading" icon={Cpu} />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {twinRow.map((item) => (
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

            <section aria-labelledby="sim-batch-heading">
              <SectionHeader title="Batch runs" href="/simulation" id="sim-batch-heading" />
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {batchRow.map((item) => (
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
