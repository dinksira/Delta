"use client";

import { useEffect, useState } from "react";

/** Matches `AuthStatusBanner` variants used after API / async responses. */
export type AuthResponseBanner =
  | { type: "success"; message: string }
  | { type: "error"; message: string }
  | { type: "info"; message: string };

const DEFAULT_DISMISS_MS = 6000;

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
