/** Safe decode of `returnTo` for parent registration → school workspace navigation. */
export function safeParentReturnHref(returnToRaw: string | null, schoolId: string): string {
  const fallback = `/features/school/${encodeURIComponent(schoolId)}`;
  if (!returnToRaw?.trim()) return fallback;
  try {
    const decoded = decodeURIComponent(returnToRaw.trim());
    if (!decoded.startsWith("/features/school/")) return fallback;
    const after = decoded.slice("/features/school/".length);
    const firstSeg = after.split(/[/?#]/)[0] ?? "";
    if (firstSeg !== schoolId) return fallback;
    return decoded;
  } catch {
    return fallback;
  }
}
