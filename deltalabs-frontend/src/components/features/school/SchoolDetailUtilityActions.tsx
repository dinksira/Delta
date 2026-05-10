/** ################################ IMPORT ############################# */
import { Bot, Link2, SquareArrowOutUpRight, Wrench } from "lucide-react";
/** ################################ /IMPORT ############################# */

/** ################################ COMPONENT ############################# */
/**
 * Integrate / Automate / Invite strip used on **school workspace** and **class** detail surfaces
 * so actions stay in the same place everywhere under School.
 */
export function SchoolDetailUtilityActions() {
  return (
    <div className="flex flex-wrap items-center justify-end gap-3 text-primary-700">
      <button
        type="button"
        className="inline-flex h-8 items-center gap-2 rounded-md px-1 text-sm font-medium transition-colors hover:bg-primary-50"
      >
        <Wrench className="size-3.5" aria-hidden />
        Integrate
      </button>
      <button
        type="button"
        className="inline-flex h-8 items-center gap-2 rounded-md px-1 text-sm font-medium transition-colors hover:bg-primary-50"
      >
        <Bot className="size-3.5" aria-hidden />
        Automate
      </button>
      <div className="inline-flex h-8 items-center overflow-hidden rounded-md border border-primary-200 bg-surface-default">
        <button
          type="button"
          className="inline-flex h-full items-center gap-2 px-3 text-sm font-medium text-primary-700 transition-colors hover:bg-primary-50"
        >
          <SquareArrowOutUpRight className="size-3.5" aria-hidden />
          Invite
        </button>
        <span className="h-5 w-px bg-primary-200" aria-hidden />
        <button
          type="button"
          className="inline-flex h-full items-center px-2.5 text-primary-700 transition-colors hover:bg-primary-50"
          aria-label="Copy invite link"
        >
          <Link2 className="size-3.5" aria-hidden />
        </button>
      </div>
    </div>
  );
}
/** ################################ /COMPONENT ############################# */
