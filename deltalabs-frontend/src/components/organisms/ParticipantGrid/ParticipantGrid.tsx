/**
 * ParticipantGrid — responsive grid of on-stage participant cards for the
 * Live Duel secondary content layer. Collapses from 4 columns (desktop) to 2
 * on small screens.
 *
 * @example
 * ```tsx
 * <ParticipantGrid participants={room.participants} />
 * ```
 */

import { Users } from "lucide-react";

import { ParticipantCard } from "@/components/molecules/ParticipantCard";
import type { LiveParticipant } from "@/modules/Competition/types/liveDuel";
import { cn } from "@/lib/utils";

export interface ParticipantGridProps {
  participants: LiveParticipant[];
  className?: string;
}

export function ParticipantGrid({ participants, className }: Readonly<ParticipantGridProps>) {
  return (
    <section aria-label="Participants on stage" className={cn("", className)}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-sm font-bold uppercase tracking-wide text-text-primary">On Stage</h2>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-muted px-3 py-1 text-xs font-semibold text-text-secondary">
          <Users className="size-3.5" aria-hidden />
          {participants.length} on stage
        </span>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
        {participants.map((participant) => (
          <ParticipantCard key={participant.id} participant={participant} />
        ))}
      </div>
    </section>
  );
}

export default ParticipantGrid;