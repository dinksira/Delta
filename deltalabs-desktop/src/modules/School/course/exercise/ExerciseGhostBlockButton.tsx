"use client";

import { Ghost } from "lucide-react";

/** Ghost marker on a content block — wires to ghost deps later; toggles local ghosted flag now. */
export function ExerciseGhostBlockButton({
  active,
  onToggle,
  label = "Mark as ghost",
}: Readonly<{
  active?: boolean;
  onToggle: () => void;
  label?: string;
}>) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      onClick={onToggle}
      className={[
        "inline-flex size-7 items-center justify-center rounded-md transition-colors",
        active
          ? "bg-primary-700 text-white"
          : "text-primary-800/70 hover:bg-primary-50 hover:text-primary-900",
      ].join(" ")}
    >
      <Ghost className="size-3.5" aria-hidden />
    </button>
  );
}
