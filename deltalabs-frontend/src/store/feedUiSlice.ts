/** ################################ IMPORT ############################# */
/** Imports used by this file. */
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

/** ################################ /IMPORT ############################# */

/** ################################ COMPONENT ############################# */
/** Main exported component logic for this file. */
type FeedUiState = Readonly<{
  commentPanelOpen: boolean;
}>;

const initialState: FeedUiState = {
  commentPanelOpen: false,
};

const feedUiSlice = createSlice({
  name: "feedUi",
  initialState,
  reducers: {
    setCommentPanelOpen(state, action: PayloadAction<boolean>) {
      state.commentPanelOpen = action.payload;
    },
  },
});

export const { setCommentPanelOpen } = feedUiSlice.actions;
export const feedUiReducer = feedUiSlice.reducer;
/** ################################ /COMPONENT ############################# */
