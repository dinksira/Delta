/**
 * ParticipantCard — one on-stage participant in the Live Duel secondary grid.
 * Shows a centered monogram avatar, the user label at the bottom-left, a
 * top-right hardware status icon (muted mic / camera off), and a host crown
 * for the room owner.
 *
 * @example
 * ```tsx
 * <ParticipantCard participant={{ id: "p1", name: "Dinksira Elsa", micMuted: true }} />
 * ```
 */

import { Crown, MicOff, VideoOff } from "lucide-react";

import { Avatar } from "@/components/atoms/Avatar";
import type { LiveParticipant } from "@/modules/Competition/types/liveDuel";
import { cn } from "@/lib/utils";

export interface ParticipantCardProps {
  participant: LiveParticipant;
  className?: string;
}

export function ParticipantCard({ participant, className }: Readonly<ParticipantCardProps>) {
  const { name, avatarUrl, isHost, isYou, micMuted, cameraOff } = participant;

  return (
    <div
      className={cn(
        "relative flex flex-col items-center gap-3 rounded-2xl border border-border-default bg-surface-default p-4 shadow-sm",
        isYou && "border-primary-400 bg-primary-50/60 dark:bg-primary-900/20",
        className,
      )}
    >
      {isHost ? (
        <span
          title="Host"
          className="absolute left-3 top-3 flex size-6 items-center justify-center rounded-full bg-primary-600 text-white"
          aria-label="Host"
        >
          <Crown className="size-3.5" aria-hidden />
        </span>
      ) : null}

      <span
        title={cameraOff ? "Camera off" : micMuted ? "Mic muted" : "Ready"}
        className="absolute right-3 top-3 flex size-6 items-center justify-center rounded-full bg-surface-muted"
        aria-label={cameraOff ? "Camera off" : micMuted ? "Mic muted" : "Ready"}
      >
        {cameraOff ? (
          <VideoOff className="size-3.5 text-secondary-600" aria-hidden />
        ) : micMuted ? (
          <MicOff className="size-3.5 text-error-600" aria-hidden />
        ) : (
          <span className="size-2 rounded-full bg-success-500" aria-hidden />
        )}
      </span>

      <Avatar
        name={name}
        src={avatarUrl}
        size="lg"
        className="ring-primary-100 dark:ring-primary-900/60"
      />

      <div className="w-full">
        <p className="truncate text-sm font-semibold leading-tight text-text-primary">
          {name}
          {isYou ? (
            <span className="ml-1.5 text-xs font-medium text-primary-600">(You)</span>
          ) : null}
        </p>
      </div>
    </div>
  );
}

export default ParticipantCard;