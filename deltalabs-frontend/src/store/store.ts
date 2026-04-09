/** ################################ IMPORT ############################# */
/** Imports used by this file. */
import { configureStore } from "@reduxjs/toolkit";

import { feedUiReducer } from "@/store/feedUiSlice";

/** ################################ /IMPORT ############################# */

/** ################################ COMPONENT ############################# */
/** Main exported component logic for this file. */
export const store = configureStore({
  reducer: {
    feedUi: feedUiReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
/** ################################ /COMPONENT ############################# */
