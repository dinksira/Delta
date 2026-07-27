import { Calendar, Users } from "lucide-react";

import { cn } from "@/lib/utils";

export interface CompetitionMetaRowProps {
  endsAt: string;
  participants: number;
  className?: string;
}

export function CompetitionMetaRow({
  endsAt,
  participants,
  className,
}: Readonly<CompetitionMetaRowProps>) {
  return (
    <div
      className={cn(
        "flex flex-col gap-1.5 text-xs text-white/80",
        className,
      )}
    >
      <span className="flex items-center gap-1.5">
        <Calendar className="size-3.5 shrink-0" aria-hidden />
        <span>Ends: {endsAt}</span>
      </span>
      <span className="flex items-center gap-1.5">
        <Users className="size-3.5 shrink-0" aria-hidden />
        <span>Participants: {participants}</span>
      </span>
    </div>
  );
}
