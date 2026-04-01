"use client";

import { LandingFeaturesIconSwitch } from "@/components/navigation/LandingFeaturesIconSwitch";

type TopNavUtilityActionsProps = Readonly<{
  profileInitials?: string;
}>;

/** Shared stroke for utility-row icons (matches globe / square switch). */
const ICON_STROKE = 1.65;

/** Robot + speech bubble — entry point for assistant chat (matches utility stroke weight). */
function NavRobotAssistantIcon({ className }: Readonly<{ className?: string }>) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M12 3.75v2.6"
        stroke="currentColor"
        strokeWidth={ICON_STROKE}
        strokeLinecap="round"
      />
      <circle cx="12" cy="2.85" r="1.15" fill="currentColor" />
      <rect
        x="5.85"
        y="7.1"
        width="12.3"
        height="10.6"
        rx="2.85"
        stroke="currentColor"
        strokeWidth={ICON_STROKE}
      />
      <circle cx="9.35" cy="11.85" r="1.2" fill="currentColor" />
      <circle cx="14.65" cy="11.85" r="1.2" fill="currentColor" />
      <path
        d="M13.15 15.1h4.35a.92.92 0 01.92.92v2.05a.92.92 0 01-.92.92h-2.55l-1.85 1.55v-1.55h-.38a.92.92 0 01-.92-.92v-2.05a.92.92 0 01.92-.92z"
        stroke="currentColor"
        strokeWidth={ICON_STROKE}
        strokeLinejoin="round"
      />
      <circle cx="15.05" cy="17.05" r="0.65" fill="currentColor" />
      <circle cx="16.75" cy="17.05" r="0.65" fill="currentColor" />
      <circle cx="18.45" cy="17.05" r="0.65" fill="currentColor" />
    </svg>
  );
}

function GlobeIcon({ className }: Readonly<{ className?: string }>) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <circle cx="12" cy="12" r={9} stroke="currentColor" strokeWidth={ICON_STROKE} />
      <path
        d="M3 12h18M12 3c2.5 3 2.5 15 0 18M12 3c-2.5 3-2.5 15 0 18"
        stroke="currentColor"
        strokeWidth={ICON_STROKE}
        strokeLinecap="round"
      />
    </svg>
  );
}

const utilityGlyphClass = "size-8 shrink-0";
const utilitySlotClass = "inline-flex h-10 w-10 shrink-0 items-center justify-center";

/** Signed-in header: assistant entry, language, avatar, square switch — aligned 32px glyphs. */
export function TopNavUtilityActions({ profileInitials }: TopNavUtilityActionsProps) {
  const initials = (profileInitials ?? "U").slice(0, 2).toUpperCase();

  return (
    <div className="flex h-10 items-center gap-2 sm:gap-2.5">
      <span
        className={`${utilitySlotClass} text-white/90`}
        role="img"
        aria-label="Chat assistant"
      >
        <NavRobotAssistantIcon className={utilityGlyphClass} />
      </span>
      <button
        type="button"
        className="inline-flex h-10 items-center gap-2 rounded-md px-1.5 text-base leading-none text-white/90 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 sm:text-[17px]"
        aria-label="Language: English"
      >
        <GlobeIcon className={`${utilityGlyphClass} opacity-90`} />
        <span className="leading-none">English</span>
      </button>
      <span
        aria-label={`Profile: ${initials}`}
        className="inline-flex size-8 shrink-0 items-center justify-center rounded-full border border-amber-200/90 bg-amber-100 text-xs font-semibold leading-none tracking-tight text-slate-800 shadow-sm sm:text-sm"
      >
        {initials}
      </span>
      <span
        className="mx-1 h-7 w-px shrink-0 bg-white/40 sm:mx-1.5"
        aria-hidden
      />
      <LandingFeaturesIconSwitch />
    </div>
  );
}
