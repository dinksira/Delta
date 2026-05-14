/** True when the landing “Audio” tab shell is active (`/audio`, `/audio/...`). */
export function isPublicAudioChromePath(pathname: string | null | undefined): boolean {
  const p = pathname ?? "";
  return p === "/audio" || p.startsWith("/audio/");
}

/**
 * True on episode detail routes (`/audio/<itemId>`), excluding hub (`/audio`) and library (`/audio/library`).
 * Used to hide dock actions that should only appear while browsing (e.g. close player).
 */
export function isPublicAudioEpisodeDetailPath(pathname: string | null | undefined): boolean {
  const p = pathname ?? "";
  const m = /^\/audio\/([^/]+)\/?$/.exec(p);
  if (!m) return false;
  const segment = m[1];
  if (!segment || segment === "library") return false;
  return true;
}
