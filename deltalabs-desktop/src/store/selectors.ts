/** ################################ IMPORT ############################# */
/** Imports used by this file. */
import type { RootState } from "@/store/store";

/** ################################ /IMPORT ############################# */

/** ################################ COMPONENT ############################# */
/** Main exported component logic for this file. */
export const selectCommentPanelOpen = (state: RootState) => state.feedUi.commentPanelOpen;
/** ################################ /COMPONENT ############################# */
