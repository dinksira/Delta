/**
 * CompetitionCard
 * A card with background image, dark gradient overlay, title, meta, tags, and Join Now button.
 */

import { Trophy, ArrowRight } from "lucide-react";

import { CompetitionMetaRow } from "@/components/molecules/CompetitionMetaRow/CompetitionMetaRow";
import { Tag } from "@/components/atoms/Tag/Tag";
import { cn } from "@/lib/utils";

export interface CompetitionCardData {
  id: string;
  title: string;
  endsAt: string;
  participants: number;
  tags: string[];
  backgroundImageUrl?: string;
}

export interface CompetitionCardProps {
  competition: CompetitionCardData;
  onJoin?: (id: string) => void;
  className?: string;
}

export function CompetitionCard({
  competition,
  onJoin,
  className,
}: Readonly<CompetitionCardProps>) {
  return (
    <article
      className={cn(
        "group relative flex min-h-[200px] flex-col justify-between overflow-hidden rounded-2xl border border-border-default bg-surface-default shadow-sm transition-shadow duration-200 hover:shadow-md",
        className,
      )}
    >
      {/* Background image or placeholder gradient */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={
          competition.backgroundImageUrl
            ? { backgroundImage: `url(${competition.backgroundImageUrl})` }
            : undefined
        }
      >
        {/* Fallback gradient if no image */}
        {!competition.backgroundImageUrl && (
          <div className="h-full w-full bg-gradient-to-br from-primary-800 via-primary-700 to-primary-900" />
        )}
        {/* Dark gradient overlay for text legibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />
      </div>

      {/* Content (above overlay) */}
      <div className="relative z-10 flex flex-col justify-between h-full p-4">
        {/* Top: trophy + title */}
        <div className="flex items-start gap-2">
          <Trophy className="mt-0.5 size-5 shrink-0 text-yellow-400" aria-hidden />
          <h3 className="text-lg font-semibold leading-tight text-white">
            {competition.title}
          </h3>
        </div>

        {/* Bottom: meta, tags, join button */}
        <div className="mt-auto flex flex-col gap-3 pt-8">
          <CompetitionMetaRow
            endsAt={competition.endsAt}
            participants={competition.participants}
          />

          {/* Tags */}
          {competition.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {competition.tags.map((tag) => (
                <Tag key={tag} className="bg-white/20 text-white">
                  {tag}
                </Tag>
              ))}
            </div>
          )}

          {/* Join Now */}
          {onJoin && (
            <button
              type="button"
              onClick={() => onJoin(competition.id)}
              className="mt-1 inline-flex w-fit items-center gap-1.5 rounded-full bg-white/20 px-4 py-1.5 text-sm font-medium text-white backdrop-blur-sm transition-colors hover:bg-white/30"
            >
              Join Now
              <ArrowRight className="size-4" />
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
