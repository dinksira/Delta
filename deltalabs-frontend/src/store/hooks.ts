/** ################################ IMPORT ############################# */
/** Imports used by this file. */
import { useDispatch, useSelector, type TypedUseSelectorHook } from "react-redux";

import type { AppDispatch, RootState } from "@/store/store";

/** ################################ /IMPORT ############################# */

/** ################################ COMPONENT ############################# */
/** Main exported component logic for this file. */
export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
/** ################################ /COMPONENT ############################# */
