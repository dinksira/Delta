"use client";

import { useState } from "react";
import { ArrowRight, Check, Code2, Image as ImageIcon, MessageSquare, PenLine } from "lucide-react";

import { Button, Card, Select, Typography } from "@/components/theme";
import { cx } from "@/components/theme/utils";
import { FeedExplorerShell } from "@/modules/Feed/views/FeedExplorerShell";

const categories = [
  "All Models",
  "LLMs",
  "Image Generators",
  "Code Assistants",
  "Data Analysis",
  "Multimodal",
  "Scientific Research",
] as const;

const modelCards = [
  {
    title: "Sonic Wave AI",
    category: "AUDIO",
    description: "Speech and sound understanding tuned for lab workflows and multilingual capture.",
    foot: "Multilingual",
    check: false,
    icon: "audio" as const,
    tone: "from-violet-500 to-indigo-800",
  },
  {
    title: "Delta Analytics Pro",
    category: "DATA",
    description: "Enterprise-grade tabular reasoning, charts, and governed data connectors.",
    foot: "Enterprise Ready",
    check: true,
    icon: "data" as const,
    tone: "from-slate-500 to-slate-800",
  },
  {
    title: "Arctic Chat Large",
    category: "LLM",
    description: "Long-context assistant for strategy, writing, and structured brainstorming.",
    foot: "128k context",
    check: false,
    icon: "llm" as const,
    tone: "from-sky-500 to-primary-800",
  },
  {
    title: "Studio Vision",
    category: "IMAGE",
    description: "Cinematic stills and texture generation with strong style adherence.",
    foot: "4K capable",
    check: false,
    icon: "image" as const,
    tone: "from-amber-500 to-orange-800",
  },
] as const;

function ModelGlyph({ kind }: Readonly<{ kind: (typeof modelCards)[number]["icon"] }>) {
  if (kind === "audio") {
    return (
      <span className="flex size-10 items-center justify-center rounded-lg bg-white/15" aria-hidden>
        <svg viewBox="0 0 24 24" className="size-5 text-white" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 3v10" />
          <path d="M8 7v4M16 7v4" />
          <path d="M6 21h12" />
        </svg>
      </span>
    );
  }
  if (kind === "data") {
    return (
      <span className="flex size-10 items-center justify-center rounded-lg bg-white/15" aria-hidden>
        <svg viewBox="0 0 24 24" className="size-5 text-white" fill="none" stroke="currentColor" strokeWidth="2">
          <ellipse cx="12" cy="5" rx="9" ry="3" />
          <path d="M3 5v6c0 1.7 4 3 9 3s9-1.3 9-3V5" />
          <path d="M3 11v6c0 1.7 4 3 9 3s9-1.3 9-3v-6" />
        </svg>
      </span>
    );
  }
  if (kind === "llm") {
    return (
      <span className="flex size-10 items-center justify-center rounded-lg bg-white/15" aria-hidden>
        <MessageSquare className="size-5 text-white" />
      </span>
    );
  }
  return (
    <span className="flex size-10 items-center justify-center rounded-lg bg-white/15" aria-hidden>
      <ImageIcon className="size-5 text-white" />
    </span>
  );
}

const hubScrollClass =
  "min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-y-contain py-2 sm:py-3";

/** AI explorer — feed shell + right “Recent activity” rail on large screens. */
export function AIExplorerView() {
  const [activeCategory, setActiveCategory] = useState<string>(categories[0]);

  return (
    <FeedExplorerShell
      leftFooter={
        <nav className="mt-4 flex flex-col gap-2 border-t border-border-default pt-4" aria-label="AI model categories">
          {categories.map((label) => {
            const active = label === activeCategory;
            return (
              <button
                key={label}
                type="button"
                onClick={() => setActiveCategory(label)}
                className={cx(
                  "rounded-full border px-3 py-2 text-left text-sm font-medium transition-colors sm:px-4",
                  active
                    ? "border-transparent bg-text-primary text-text-inverse"
                    : "border-border-default bg-surface-default text-text-primary hover:bg-surface-muted",
                )}
              >
                {label}
              </button>
            );
          })}
        </nav>
      }
      rightAside={
        <div className="flex min-w-0 flex-col gap-4">
          <div className="flex items-center justify-between gap-2">
            <Typography as="h2" variant="h2" className="text-lg font-semibold">
              Recent activity
            </Typography>
            <button
              type="button"
              className="text-sm font-medium text-text-secondary hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40"
            >
              Clear all
            </button>
          </div>
          <Card className="gap-4 p-4">
            <ul className="flex flex-col gap-4">
              <li className="flex gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-surface-muted">
                  <MessageSquare className="size-4 text-text-secondary" aria-hidden />
                </span>
                <div className="min-w-0">
                  <Typography variant="label" className="font-semibold">
                    Marketing Strategy Chat
                  </Typography>
                  <Typography variant="small" className="text-text-secondary">
                    Updated 2 hours ago · Arctic Chat Large
                  </Typography>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-surface-muted">
                  <ImageIcon className="size-4 text-text-secondary" aria-hidden />
                </span>
                <div className="min-w-0">
                  <Typography variant="label" className="font-semibold">
                    Futuristic Cityscape Render
                  </Typography>
                  <Typography variant="small" className="text-text-secondary">
                    4 images generated · Studio Vision
                  </Typography>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-surface-muted">
                  <Code2 className="size-4 text-text-secondary" aria-hidden />
                </span>
                <div className="min-w-0">
                  <Typography variant="label" className="font-semibold">
                    Python Web Scraper Debug
                  </Typography>
                  <Typography variant="small" className="text-text-secondary">
                    Yesterday · Code Assistant
                  </Typography>
                </div>
              </li>
            </ul>
            <Button type="button" variant="secondary" className="w-full">
              View full history
            </Button>
          </Card>
        </div>
      }
      center={
        <div className={hubScrollClass}>
          <div className="mx-auto min-w-0 max-w-5xl space-y-10 px-1 pb-10 sm:px-2">
            <section aria-labelledby="ai-featured-heading" className="space-y-4">
              <Typography as="h2" variant="h2" id="ai-featured-heading" className="text-xl sm:text-2xl">
                Explorer
              </Typography>
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <Card className="gap-4 border-transparent bg-slate-900 p-6 text-text-inverse shadow-lg">
                  <span className="inline-flex w-fit rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white/90">
                    New release
                  </span>
                  <Typography as="h3" variant="h3" className="text-white">
                    Delta-4 Omni
                  </Typography>
                  <Typography variant="small" className="text-slate-300">
                    Our most advanced multimodal model yet, capable of real-time vision, audio, and reasoning
                    across complex datasets.
                  </Typography>
                  <Button
                    type="button"
                    variant="secondary"
                    className="mt-2 w-fit border-0 bg-white text-text-primary hover:bg-slate-100"
                  >
                    Try now
                    <ArrowRight className="size-4" aria-hidden />
                  </Button>
                </Card>

                <Card className="gap-4 border-border-default bg-surface-default p-6 shadow-sm">
                  <span className="inline-flex w-fit rounded-full border border-border-default bg-surface-muted px-3 py-1 text-xs font-semibold uppercase tracking-wide text-text-secondary">
                    Creative
                  </span>
                  <Typography as="h3" variant="h3">
                    Studio Vision
                  </Typography>
                  <Typography variant="small" className="text-text-secondary">
                    Generate cinematic quality images and 4K textures with unprecedented stylistic control and
                    prompt adherence.
                  </Typography>
                  <Button type="button" variant="primary" className="mt-2 w-fit">
                    Explore
                    <PenLine className="size-4" aria-hidden />
                  </Button>
                </Card>
              </div>
            </section>

            <section aria-labelledby="ai-models-heading">
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <Typography as="h2" variant="h2" id="ai-models-heading" className="text-xl sm:text-2xl">
                  Global AI Models
                </Typography>
                <label className="flex min-w-[12rem] flex-col gap-1 sm:max-w-xs">
                  <span className="sr-only">Sort models</span>
                  <Select id="ai-models-sort" defaultValue="popularity" aria-label="Sort by">
                    <option value="popularity">Sort by popularity</option>
                    <option value="newest">Sort by newest</option>
                    <option value="name">Sort by name</option>
                  </Select>
                </label>
              </div>
              <Typography variant="small" className="mb-4 text-text-secondary">
                Showing placeholders for{" "}
                <span className="font-medium text-text-primary">{activeCategory}</span>.
              </Typography>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {modelCards.map((m) => (
                  <Card key={m.title} className="gap-0 overflow-hidden p-0">
                    <div className={`flex items-start gap-4 bg-gradient-to-br p-5 ${m.tone}`}>
                      <ModelGlyph kind={m.icon} />
                      <div className="min-w-0 space-y-1">
                        <span className="text-xs font-semibold uppercase tracking-wide text-white/80">
                          {m.category}
                        </span>
                        <Typography as="h3" variant="h3" className="text-lg text-white">
                          {m.title}
                        </Typography>
                      </div>
                    </div>
                    <div className="space-y-3 p-5">
                      <Typography variant="small" className="text-text-secondary">
                        {m.description}
                      </Typography>
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-text-secondary">
                          {m.check ? <Check className="size-3.5 text-primary-600" aria-hidden /> : null}
                          {m.foot}
                        </span>
                        <button
                          type="button"
                          className="text-sm font-semibold text-primary-600 hover:text-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40"
                        >
                          Launch
                        </button>
                      </div>
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
