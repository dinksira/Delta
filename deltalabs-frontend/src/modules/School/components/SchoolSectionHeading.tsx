import { Typography } from "@/components/theme";

type SchoolSectionHeadingProps = Readonly<{
  /** Lighter line above the title (e.g. “My School”). */
  eyebrow?: string;
  /** Primary heading line. */
  title?: string;
  /** Optional line below the title (e.g. “Archived”). */
  subtitle?: string;
  /** Use `h1` for page chrome; `h2` for in-page sections (e.g. above a table). */
  titleAs?: "h1" | "h2" | "h3";
}>;

/** Matches `SchoolWorkspaceHeader` title stack — eyebrow → bold title → optional subtitle. */
export function SchoolSectionHeading({
  eyebrow,
  title,
  subtitle,
  titleAs = "h2",
}: SchoolSectionHeadingProps) {
  const hasContent = Boolean(eyebrow || title || subtitle);
  if (!hasContent) {
    return null;
  }

  return (
    <div className="min-w-0 space-y-1">
      {eyebrow ? (
        <Typography variant="small" className="font-medium text-text-secondary">
          {eyebrow}
        </Typography>
      ) : null}
      {title ? (
        <Typography
          as={titleAs}
          variant="h1"
          className="text-2xl font-bold leading-tight text-text-primary sm:text-3xl"
        >
          {title}
        </Typography>
      ) : null}
      {subtitle ? (
        <Typography variant="body" className="text-text-secondary">
          {subtitle}
        </Typography>
      ) : null}
    </div>
  );
}
