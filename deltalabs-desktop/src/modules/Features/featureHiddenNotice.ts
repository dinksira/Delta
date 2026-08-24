/** Query params when navigation is blocked because a feature is hidden. */

export const FEATURE_HIDDEN_NOTICE_PARAM = "notice";
export const FEATURE_HIDDEN_NOTICE_VALUE = "feature-hidden";
export const FEATURE_HIDDEN_FEATURE_PARAM = "feature";

export function featuresPathWithHiddenNotice(featureKey: string): string {
  const params = new URLSearchParams({
    [FEATURE_HIDDEN_NOTICE_PARAM]: FEATURE_HIDDEN_NOTICE_VALUE,
    [FEATURE_HIDDEN_FEATURE_PARAM]: featureKey.trim().toLowerCase(),
  });
  return `/features?${params.toString()}`;
}

export function readHiddenFeatureNotice(
  searchParams: URLSearchParams,
): string | null {
  if (searchParams.get(FEATURE_HIDDEN_NOTICE_PARAM) !== FEATURE_HIDDEN_NOTICE_VALUE) {
    return null;
  }
  const feature = searchParams.get(FEATURE_HIDDEN_FEATURE_PARAM)?.trim().toLowerCase();
  return feature && feature.length > 0 ? feature : null;
}

export function pathnameWithoutHiddenNotice(searchParams: URLSearchParams): string {
  const next = new URLSearchParams(searchParams.toString());
  next.delete(FEATURE_HIDDEN_NOTICE_PARAM);
  next.delete(FEATURE_HIDDEN_FEATURE_PARAM);
  const q = next.toString();
  return q ? `/features?${q}` : "/features";
}
