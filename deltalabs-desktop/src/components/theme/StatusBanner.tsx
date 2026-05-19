/** ################################ IMPORT ############################# */
/** Imports used by this file. */
import { Typography } from "@/components/theme/Typography";

/** ################################ /IMPORT ############################# */

/** ################################ COMPONENT ############################# */
/** Main exported component logic for this file. */
export type StatusBannerType = "success" | "error" | "info";

export type StatusBannerProps = Readonly<{
  type: StatusBannerType;
  message: string;
  typeStyles: Readonly<Record<StatusBannerType, string>>;
  symbols?: Readonly<Record<StatusBannerType, string>>;
  className?: string;
}>;

const DEFAULT_SYMBOLS: Readonly<Record<StatusBannerType, string>> = {
  success: "OK",
  error: "!",
  info: "i",
};

/** Shared status/feedback banner primitive. */
export function StatusBanner({
  type,
  message,
  typeStyles,
  symbols = DEFAULT_SYMBOLS,
  className,
}: StatusBannerProps) {
  return (
    <div className={`flex items-center gap-2 px-6 py-2 ${typeStyles[type]} ${className ?? ""}`}>
      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-current text-xs font-bold" aria-hidden>
        {symbols[type]}
      </span>
      <Typography as="span" variant="small" className="font-medium">
        {message}
      </Typography>
    </div>
  );
}
/** ################################ /COMPONENT ############################# */
