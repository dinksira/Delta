import { Typography } from "@/components/theme";

/** Placeholder terms of use until legal content is provided. */
export function TermsPageView() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <Typography as="h1" variant="h2" className="mb-4">
        Terms of use
      </Typography>
      <Typography variant="body" className="text-text-secondary">
        Terms of use will be published here before production launch.
      </Typography>
    </div>
  );
}
