/** ################################ COMPONENT ############################# */
/** Emoji disclosure inside the MessageModal composer. */

import React from "react";

import { Smile } from "lucide-react";

import { cn } from "@/lib/utils";
import { emojiButtonClasses, emojiPanelClasses, emojiToggleClasses } from "./variants";

/** Props for {@link EmojiPicker}. */
export interface EmojiPickerProps {
  /** Emoji to offer. */
  emojis: readonly string[];
  /** Whether the panel is expanded. */
  isOpen: boolean;
  /** Toggles the panel. */
  onToggle: () => void;
  /** Chooses an emoji and closes the panel. */
  onSelect: (emoji: string) => void;
  /** Accessible name for the toggle. */
  label: string;
}

/**
 * A small emoji disclosure.
 *
 * Intentionally **not** the shared `Popover`: that anchors below its trigger
 * and manages a dismiss backdrop, whereas this panel sits above the composer
 * and is part of the form. Escape closes it and each emoji is a labelled button.
 */
export function EmojiPicker({
  emojis,
  isOpen,
  onToggle,
  onSelect,
  label,
}: Readonly<EmojiPickerProps>) {
  return (
    // Escape is handled on the wrapper so it works whether focus sits on the
    // toggle or inside the panel; otherwise the panel would be un-dismissable
    // straight after opening.
    <div
      className="relative"
      onKeyDown={(event) => {
        if (event.key === "Escape" && isOpen) {
          event.preventDefault();
          event.stopPropagation();
          onToggle();
        }
      }}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-label={label}
        className={cn(emojiToggleClasses, isOpen ? "text-primary-600" : "text-primary-600/40")}
      >
        <Smile className="size-5" aria-hidden="true" />
      </button>

      {isOpen ? (
        <div role="group" aria-label="Emoji" className={emojiPanelClasses}>
          {emojis.map((emoji) => (
            <button
              key={emoji}
              type="button"
              aria-label={`Insert ${emoji}`}
              onClick={() => onSelect(emoji)}
              className={emojiButtonClasses}
            >
              <span aria-hidden="true">{emoji}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
/** ################################ /COMPONENT ############################# */
