"use client";

/** ################################ IMPORT ############################# */
/** Imports used by this file. */
import { useEffect, useState } from "react";

/** ################################ /IMPORT ############################# */
/** ################################ TYPES ############################# */
/** Matches `AuthStatusBanner` variants used after API / async responses. */
export type AuthResponseBanner =
  | { type: "success"; message: string }
  | { type: "error"; message: string }
  | { type: "info"; message: string };

/** ################################ /TYPES ############################# */
/** ################################ CONSTANTS ############################# */
/** Shared constants used by this file. */
const DEFAULT_DISMISS_MS = 6000;

/** ################################ /CONSTANTS ############################# */
/** ################################ HOOKS ############################# */
/**
 * Banner state for auth modals; clears automatically so the muted header strip
 * only stays while the message is relevant.
 */
export function useAuthResponseBanner(dismissAfterMs: number = DEFAULT_DISMISS_MS) {
  const [banner, setBanner] = useState<AuthResponseBanner | null>(null);

  useEffect(() => {
    if (banner == null) {
      return;
    }
    const id = window.setTimeout(() => {
      setBanner(null);
    }, dismissAfterMs);
    return () => window.clearTimeout(id);
  }, [banner, dismissAfterMs]);

  return [banner, setBanner] as const;
}
/** ################################ /HOOKS ############################# */
