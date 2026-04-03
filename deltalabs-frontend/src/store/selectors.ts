import type { RootState } from "@/store/store";

export const selectCommentPanelOpen = (state: RootState) => state.feedUi.commentPanelOpen;
