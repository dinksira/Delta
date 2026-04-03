import { configureStore } from "@reduxjs/toolkit";

import { feedUiReducer } from "@/store/feedUiSlice";

export const store = configureStore({
  reducer: {
    feedUi: feedUiReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
