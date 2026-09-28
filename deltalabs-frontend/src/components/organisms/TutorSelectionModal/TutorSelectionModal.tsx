/**
 * TutorSelectionModal
 * Organism: dialog for picking tutors to invite to a course.
 *
 * Fully controlled — tutors, selection, and the auto-match flag all come from
 * the caller — so it can be driven by a feature hook without prop-drilling
 * through the dialog. Data used to be a hardcoded module constant with eight
 * remote placeholder photos and three duplicate names; it is now a prop, and
 * avatars fall back to monograms.
 *
 * @example
 * ```tsx
 * <TutorSelectionModal
 *   isOpen={open}
 *   onClose={() => setOpen(false)}
 *   tutors={tutors}
 *   selectedTutorIds={selectedIds}
 *   onToggleTutor={toggleTutor}
 *   onConfirm={(ids) => inviteTutors(ids)}
 *   autoMatch={autoMatch}
 *   onAutoMatchChange={setAutoMatch}
 * />
 * ```
 */

/** ################################ IMPORT ############################# */
/** React core, shared primitives, and local building blocks. */
import React, { useMemo, useState } from "react";

import { Modal } from "@/components/atoms/Modal/Modal";
import { Button } from "@/components/theme/Button";
import { SearchInput } from "@/components/theme/SearchInput";
import { Switch } from "@/components/theme/Switch";
import { cn } from "@/lib/utils";
import type { Tutor, TutorSelectionModalProps } from "./TutorSelectionModal.types";
import { TutorCard } from "./TutorCard";
import {
  autoMatchClasses,
  autoMatchLabelClasses,
  contentClasses,
  controlsClasses,
  emptyClasses,
  footerClasses,
  gridClasses,
} from "./variants";
/** ################################ /IMPORT ############################# */

/** ################################ COMPONENT ############################# */
/** Main exported component logic for this file. */

/** Matches a tutor against the search query on name and credential. */
function useTutorSearch(tutors: readonly Tutor[], query: string) {
  return useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) {
      return tutors;
    }
    return tutors.filter(
      (tutor) =>
        tutor.name.toLowerCase().includes(needle) ||
        tutor.title.toLowerCase().includes(needle),
    );
  }, [query, tutors]);
}

/** Props for {@link TutorToolbar}. */
export interface TutorToolbarProps {
  /** Current search text. */
  searchQuery: string;
  /** Updates the search text. */
  onSearchChange: (value: string) => void;
  /** Whether auto-match is on. */
  autoMatch: boolean;
  /** Toggles auto-match. */
  onAutoMatchChange: (checked: boolean) => void;
}

/** Search field and auto-match switch. */
function TutorToolbar({
  searchQuery,
  onSearchChange,
  autoMatch,
  onAutoMatchChange,
}: Readonly<TutorToolbarProps>) {
  return (
    <div className={controlsClasses}>
      <SearchInput
        aria-label="Search tutors"
        placeholder="Search by name or subject"
        value={searchQuery}
        onChange={(event) => onSearchChange(event.target.value)}
      />

      <div className={autoMatchClasses}>
        <Switch checked={autoMatch} onCheckedChange={onAutoMatchChange} label="Auto match" />
        <span className={autoMatchLabelClasses}>Auto match</span>
      </div>
    </div>
  );
}

/** Props for {@link TutorFooter}. */
export interface TutorFooterProps {
  /** How many tutors are currently selected. */
  count: number;
  /** Applies the selection and closes the dialog. */
  onConfirm: () => void;
}

/** Footer holding the single confirm action. */
function TutorFooter({ count, onConfirm }: Readonly<TutorFooterProps>) {
  return (
    <div className={footerClasses}>
      <Button size="lg" disabled={count === 0} onClick={onConfirm}>
        Invite{count > 0 ? ` (${count})` : ""}
      </Button>
    </div>
  );
}

/** Props for {@link TutorList}. */
export interface TutorListProps {
  /** Tutors left after the search filter. */
  tutors: readonly Tutor[];
  /** Ids of the selected tutors. */
  selectedIds: ReadonlySet<string>;
  /** Requests a toggle for a tutor. */
  onToggle: (tutor: Tutor) => void;
  /** Shown when nothing matches. */
  emptyMessage: string;
}

/** The tutor grid, or the empty state. */
function TutorList({ tutors, selectedIds, onToggle, emptyMessage }: Readonly<TutorListProps>) {
  if (tutors.length === 0) {
    return <p className={emptyClasses}>{emptyMessage}</p>;
  }

  return (
    <div className={gridClasses}>
      {tutors.map((tutor) => (
        <TutorCard
          key={tutor.id}
          tutor={tutor}
          isSelected={selectedIds.has(tutor.id)}
          onToggle={onToggle}
        />
      ))}
    </div>
  );
}

/** Lets the user pick tutors to invite. */
export function TutorSelectionModal({
  isOpen,
  onClose,
  tutors,
  selectedTutorIds = [],
  onToggleTutor,
  onConfirm,
  autoMatch = false,
  onAutoMatchChange,
  emptyMessage = "No tutors match your search.",
  className,
}: Readonly<TutorSelectionModalProps>) {
  const [searchQuery, setSearchQuery] = useState("");
  const filteredTutors = useTutorSearch(tutors, searchQuery);
  const selectedSet = useMemo(() => new Set(selectedTutorIds), [selectedTutorIds]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Tutors" ariaLabel="Select tutors" noPadding>
      <div className={cn(contentClasses, className)}>
        <TutorToolbar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          autoMatch={autoMatch}
          onAutoMatchChange={onAutoMatchChange ?? (() => undefined)}
        />

        <TutorList
          tutors={filteredTutors}
          selectedIds={selectedSet}
          onToggle={(tutor) => onToggleTutor?.(tutor)}
          emptyMessage={emptyMessage}
        />

        <TutorFooter
          count={selectedTutorIds.length}
          onConfirm={() => {
            onConfirm?.([...selectedTutorIds]);
            onClose();
          }}
        />
      </div>
    </Modal>
  );
}

TutorSelectionModal.displayName = "TutorSelectionModal";
/** ################################ /COMPONENT ############################# */

/** ################################ EXPORTS ############################# */
export default TutorSelectionModal;
/** ################################ /EXPORTS ############################# */
