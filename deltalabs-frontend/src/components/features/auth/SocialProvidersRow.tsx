/** ################################ IMPORT ############################# */
/** Imports used by this file. */
import {
  SocialIconApple,
  SocialIconFacebook,
  SocialIconGitHub,
  SocialIconGoogle,
} from "@/components/features/auth/SocialProviderGlyphs";

/** ################################ /IMPORT ############################# */
/** ################################ TYPES ############################# */
/** Type definitions used in this file. */
type SocialProvidersRowProps = Readonly<{
  mode: "signin" | "signup";
}>;

/** ################################ /TYPES ############################# */
/** ################################ CONSTANTS ############################# */
/** Shared constants used by this file. */
const providers = [
  { key: "google", label: "Google", Icon: SocialIconGoogle, className: "" },
  { key: "apple", label: "Apple", Icon: SocialIconApple, className: "text-text-primary" },
  { key: "github", label: "GitHub", Icon: SocialIconGitHub, className: "text-text-primary" },
  { key: "facebook", label: "Facebook", Icon: SocialIconFacebook, className: "" },
] as const;

/** ################################ /CONSTANTS ############################# */
/** ################################ COMPONENT ############################# */
/** Main exported component logic for this file. */
export function SocialProvidersRow({ mode }: SocialProvidersRowProps) {
  return (
    <div className="rounded-md border border-border-default bg-auth-modal-surface px-4 py-3.5">
      <div className="flex items-center justify-center gap-2 sm:gap-3">
        {providers.map(({ key, label, Icon, className }) => (
          <button
            key={key}
            type="button"
            aria-label={`${mode === "signin" ? "Sign in" : "Sign up"} with ${label}`}
            className={`inline-flex h-11 w-11 items-center justify-center rounded-full text-text-primary transition-colors hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2 focus-visible:ring-offset-auth-modal-surface ${className}`}
          >
            <Icon />
          </button>
        ))}
      </div>
    </div>
  );
}
/** ################################ /COMPONENT ############################# */
