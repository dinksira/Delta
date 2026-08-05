/**
 * Props for the PrivateMatchSettings organism.
 *
 * The panel is conditionally revealed (inline accordion) below the visibility
 * grid when the Private Match card is selected in the match type step.
 */
export interface PrivateMatchSettingsProps {
  /** Expand/collapse the panel inline (250ms ease-out height + fade). */
  open: boolean;
  /** Optional join-code override; an 8-character code is generated on mount when omitted. */
  initialCode?: string;
  /** Base URL used to build the invite link (`{base}/join/{code}`). */
  inviteBaseUrl?: string;
  className?: string;
}
