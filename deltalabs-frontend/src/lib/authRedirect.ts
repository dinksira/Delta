export function buildLoginModalRedirectHref(nextPath?: string): string {
  const params = new URLSearchParams();
  params.set("auth", "login");
  if (nextPath) {
    const normalizedNext = nextPath.startsWith("/") ? nextPath : `/${nextPath}`;
    params.set("next", normalizedNext);
  }
  return `/?${params.toString()}`;
}
