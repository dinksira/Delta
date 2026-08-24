import { Trophy, ArrowRight } from "lucide-react";

import { CompetitionMetaRow } from "@/components/molecules/CompetitionMetaRow/CompetitionMetaRow";
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
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={
          competition.backgroundImageUrl
            ? { backgroundImage: `url(${competition.backgroundImageUrl})` }
            : undefined
        }
      >
        {!competition.backgroundImageUrl && (
          <div className="h-full w-full bg-gradient-to-br from-primary-800 via-primary-700 to-primary-900" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20" />
      </div>

      <div className="relative z-10 flex h-full flex-col justify-between p-4">
        <div className="flex items-start gap-2">
          <Trophy className="mt-0.5 size-5 shrink-0 text-yellow-400" aria-hidden />
          <h3 className="text-lg font-semibold leading-tight text-white">
            {competition.title}
          </h3>
        </div>

        <div className="mt-auto flex flex-col gap-3 pt-8">
          <CompetitionMetaRow
            endsAt={competition.endsAt}
            participants={competition.participants}
          />

          {competition.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {competition.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-medium text-white"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

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
