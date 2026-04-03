import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

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
