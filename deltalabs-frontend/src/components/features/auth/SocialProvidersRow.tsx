type SocialProvidersRowProps = Readonly<{
  mode: "signin" | "signup";
}>;

const providers = [
  { key: "google", label: "Google", mark: "G", className: "text-[#ea4335]" },
  { key: "apple", label: "Apple", mark: "A", className: "text-black dark:text-white" },
  { key: "github", label: "GitHub", mark: "GH", className: "text-black dark:text-white text-xs" },
  { key: "facebook", label: "Facebook", mark: "f", className: "text-[#1877f2] text-2xl leading-none" },
] as const;

export function SocialProvidersRow({ mode }: SocialProvidersRowProps) {
  return (
    <div className="rounded-lg border border-border-default bg-surface-default px-5 py-3">
      <div className="flex items-center justify-center gap-5 sm:gap-6">
        {providers.map((provider) => (
          <button
            key={provider.key}
            type="button"
            aria-label={`${mode === "signin" ? "Sign in" : "Sign up"} with ${provider.label}`}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400"
          >
            <span className={`font-bold ${provider.className}`}>{provider.mark}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
