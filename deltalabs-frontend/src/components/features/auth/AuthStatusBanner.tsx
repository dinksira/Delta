type AuthStatusBannerType = "success" | "error" | "info";

type AuthStatusBannerProps = Readonly<{
  type: AuthStatusBannerType;
  message: string;
}>;

function IconSuccess() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" aria-hidden className="shrink-0 text-auth-feedback-success-text">
      <circle cx={12} cy={12} r={9.5} stroke="currentColor" strokeWidth={1.75} />
      <path
        d="m8 12 2.5 2.5L16 9"
        stroke="currentColor"
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconError() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" aria-hidden className="shrink-0">
      <circle cx={12} cy={12} r={10} className="fill-auth-feedback-error-text" />
      <path
        d="M15 9 9 15M9 9l6 6"
        stroke="white"
        strokeWidth={1.75}
        strokeLinecap="round"
      />
    </svg>
  );
}

function IconInfo() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="none" aria-hidden className="shrink-0 text-auth-feedback-info-text">
      <circle cx={12} cy={12} r={9.5} stroke="currentColor" strokeWidth={1.75} />
      <path d="M12 10v6M12 7h.01" stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
    </svg>
  );
}

/**
 * Request / server response feedback for auth modals: centered in the header strip
 * (muted top bar), with type-colored icon + text — not field validation.
 */
export function AuthStatusBanner({ type, message }: AuthStatusBannerProps) {
  const isError = type === "error";
  const role = isError ? "alert" : "status";
  const textClass =
    type === "success"
      ? "text-auth-feedback-success-text"
      : type === "error"
        ? "text-auth-feedback-error-text"
        : "text-auth-feedback-info-text";

  return (
    <div
      role={role}
      className={`flex min-w-0 max-w-full items-center justify-center gap-2 ${textClass}`}
    >
      {type === "success" ? <IconSuccess /> : null}
      {type === "error" ? <IconError /> : null}
      {type === "info" ? <IconInfo /> : null}
      <span className="truncate text-center text-sm font-medium leading-snug">{message}</span>
    </div>
  );
}
