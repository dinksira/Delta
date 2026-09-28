/** ################################ COMPONENT ############################# */
/** One selectable tutor card inside TutorSelectionModal. */

import React from "react";

import { Avatar } from "@/components/atoms/Avatar/Avatar";
import { Check } from "lucide-react";

import { cn } from "@/lib/utils";
import type { Tutor } from "./TutorSelectionModal.types";
import {
  avatarFrameClasses,
  cardClasses,
  cardSelectedClasses,
  checkClasses,
  checkIdleClasses,
  checkSelectedClasses,
  nameClasses,
  titleClasses,
} from "./variants";

/** Props for {@link TutorCard}. */
export interface TutorCardProps {
  /** The tutor this card represents. */
  tutor: Tutor;
  /** Whether this tutor is currently selected. */
  isSelected: boolean;
  /** Activates the card. */
  onToggle: (tutor: Tutor) => void;
}

/**
 * A tutor as a single toggle control.
 *
 * The whole card is one `<button>` with `aria-pressed`, rather than a clickable
 * `<div>` — the previous version had no role, no keyboard access, and no way to
 * expose the selected state.
 */
export function TutorCard({ tutor, isSelected, onToggle }: Readonly<TutorCardProps>) {
  return (
    <button
      type="button"
      aria-pressed={isSelected}
      onClick={() => onToggle(tutor)}
      className={cn(cardClasses, isSelected && cardSelectedClasses)}
    >
      <span className={avatarFrameClasses}>
        {/* Decorative: the name is already the card's accessible label. */}
        <span aria-hidden="true" className="block size-full">
          <Avatar name={tutor.name} src={tutor.avatarUrl} size="xl" className="size-full rounded-lg ring-0" />
        </span>
        <span
          aria-hidden="true"
          className={cn(checkClasses, isSelected ? checkSelectedClasses : checkIdleClasses)}
        >
          {isSelected ? <Check className="size-2.5 text-primary-600" strokeWidth={4} /> : null}
        </span>
      </span>

      <span className={nameClasses}>{tutor.name}</span>
      <span className={titleClasses}>{tutor.title}</span>
    </button>
  );
}
/** ################################ /COMPONENT ############################# */
