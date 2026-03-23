import { Typography } from "@/components/theme";

/** Placeholder privacy policy until legal content is provided. */
export function PrivacyPageView() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <Typography as="h1" variant="h2" className="mb-4">
        Privacy
      </Typography>
      <Typography variant="body" className="text-text-secondary">
        Privacy policy content will be published here before production launch.
      </Typography>
    </div>
  );
}
