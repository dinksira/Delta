/**
 * BattleCreatedModal
 * Atomic Level: Organism
 *
 * Success modal shown after a topic battle is created: celebratory check,
 * battle recap (format / entry fee / prize pool / date), and a primary
 * "Manage Battle" action.
 */

import { CheckCircle2 } from "lucide-react";

import { Button } from "@/components/theme/Button";
import { Dialog } from "@/components/theme/Dialog";
import { Typography } from "@/components/theme/Typography";

export interface BattleCreatedDetails {
  title: string;
  format: string;
  entryFee: string;
  prizePool: string;
  date: string;
}

export interface BattleCreatedModalProps {
  isOpen: boolean;
  onClose: () => void;
  onManageBattle: () => void;
  battleDetails: BattleCreatedDetails;
  className?: string;
}

export function BattleCreatedModal({
  isOpen,
  onClose,
  onManageBattle,
  battleDetails,
  className,
}: Readonly<BattleCreatedModalProps>) {
  return (
    <Dialog isOpen={isOpen} onClose={onClose} size="md" className={className}>
      <div className="flex flex-col items-center gap-5 p-8 text-center">
        <span className="flex size-16 items-center justify-center rounded-full bg-success-100 text-success-600">
          <CheckCircle2 className="size-9" aria-hidden />
        </span>

        <div>
          <Typography as="h2" className="text-xl font-bold text-text-primary">
            Battle Created!
          </Typography>
          <Typography className="mt-1 text-sm text-text-secondary">
            {battleDetails.title} is now live on the topic battles page.
          </Typography>
        </div>

        <div className="grid w-full grid-cols-2 gap-3 text-left">
          <DetailCell label="Format" value={battleDetails.format} />
          <DetailCell label="Entry Fee" value={battleDetails.entryFee} />
          <DetailCell label="Prize Pool" value={battleDetails.prizePool} />
          <DetailCell label="Start" value={battleDetails.date} />
        </div>

        <div className="flex w-full flex-col gap-2">
          <Button className="w-full" onClick={onManageBattle}>
            Manage Battle
          </Button>
          <Button variant="ghost" className="w-full" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Dialog>
  );
}

function DetailCell({ label, value }: Readonly<{ label: string; value: string }>) {
  return (
    <div className="flex flex-col gap-0.5 rounded-lg border border-border-default bg-surface-muted/60 px-3 py-2.5">
      <span className="text-[10px] font-semibold uppercase tracking-wide text-text-tertiary">
        {label}
      </span>
      <span className="text-sm font-bold text-text-primary">{value}</span>
    </div>
  );
}

export default BattleCreatedModal;
