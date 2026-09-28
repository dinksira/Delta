/** ################################ TYPES ############################# */
/** Props contract for TutorSelectionModal. */

/** A tutor the user may invite. */
export interface Tutor {
  /** Stable id, matched against `selectedTutorIds`. */
  id: string;
  /** Display name; also the source of the avatar monogram. */
  name: string;
  /** Short credential line, e.g. `"PhD in Physics"`. */
  title: string;
  /**
   * Optional avatar URL. Omit it and the shared `Avatar` renders a monogram,
   * which is the expected path — remote placeholder photos are not used.
   */
  avatarUrl?: string;
}

/** Props for {@link TutorSelectionModal}. */
export interface TutorSelectionModalProps {
  /** Whether the dialog is visible. */
  isOpen: boolean;
  /** Dismisses the dialog without inviting anyone. */
  onClose: () => void;
  /** Tutors to offer. Supplied by the caller so the component holds no data. */
  tutors: readonly Tutor[];
  /** Ids currently selected. Drives the `aria-pressed` state of each card. */
  selectedTutorIds?: readonly string[];
  /** Fired when a card is activated, so the caller owns selection state. */
  onToggleTutor?: (tutor: Tutor) => void;
  /** Fired by the confirm button with the ids selected at that moment. */
  onConfirm?: (selectedIds: string[]) => void;
  /** Whether "auto match" is on. Defaults to `false`. */
  autoMatch?: boolean;
  /** Fired when "auto match" is toggled. */
  onAutoMatchChange?: (autoMatch: boolean) => void;
  /** Message shown when no tutor matches the search. */
  emptyMessage?: string;
  /** Extra classes merged onto the dialog content. */
  className?: string;
}
/** ################################ /TYPES ############################# */
