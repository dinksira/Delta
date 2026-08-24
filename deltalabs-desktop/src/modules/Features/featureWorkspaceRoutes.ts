/** Stable workspace routing by catalog `feature_key` (not display labels). */

const FEATURE_WORKSPACE_HREF: Readonly<Record<string, string>> = {
  school: "/features/school",
  course: "/features/course",
  competitions: "/features/competitions",
};

/** Tab `param` stored in FeatureTabs — always the catalog feature key. */
export function featureKeyToTabParam(featureKey: string): string {
  return featureKey.trim().toLowerCase();
}

/** Resolve catalog feature key from a workspace tab `param` (e.g. `school-abc` → `school`). */
export function tabParamToFeatureKey(param: string): string {
  const clean = param.trim().toLowerCase();
  if (clean === "school" || clean.startsWith("school-")) return "school";
  if (clean === "course" || clean.startsWith("course-")) return "course";
  if (clean === "competitions" || clean.startsWith("competitions-")) return "competitions";
  return clean;
}

export function getFeatureWorkspaceHref(featureKey: string): string | undefined {
  return FEATURE_WORKSPACE_HREF[featureKeyToTabParam(featureKey)];
}

export function getFeatureWorkspaceDestination(featureKey: string): Readonly<{
  param: string;
  href?: string;
}> {
  const param = featureKeyToTabParam(featureKey);
  const href = getFeatureWorkspaceHref(param);
  return href ? { param, href } : { param };
}

export function resolveFeatureKeyFromPath(pathname: string, tabQuery: string | null): string | null {
  if (pathname.startsWith("/features/school")) return "school";
  if (pathname.startsWith("/features/course")) return "course";
  if (pathname.startsWith("/features/competitions")) return "competitions";
  if (pathname === "/features" && tabQuery) return featureKeyToTabParam(tabQuery);
  return null;
}
