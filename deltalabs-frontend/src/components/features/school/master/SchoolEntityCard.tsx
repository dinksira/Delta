/** ################################ IMPORT ############################# */
/** Imports used by this file. */
import Image from "next/image";
import { ExternalLink, MapPin, Users } from "lucide-react";

import { Button, Card, Typography } from "@/components/theme";

/** ################################ /IMPORT ############################# */
/** ################################ CONSTANTS ############################# */
/** Shared constants used by this file. */
const DEFAULT_SCHOOL_LOGO = "/school/addis-ababa-university-logo.png";

const logoShellClass =
  "relative mx-auto size-24 shrink-0 overflow-hidden rounded-full border border-border-default bg-surface-default";

/** ################################ /CONSTANTS ############################# */
/** ################################ TYPES ############################# */
/** Type definitions used in this file. */
type SchoolEntityCardProps = Readonly<{
  name?: string;
  location?: string;
  partnershipLabel?: string;
  /** Optional crest; defaults to Addis Ababa University asset in `/public/school`. */
  logoSrc?: string;
  /** Primary CTA — portal home uses primary; marketplace uses green Buy. */
  ctaVariant?: "portal" | "marketplace" | "archive";
}>;

/** ################################ /TYPES ############################# */
/** ################################ COMPONENT ############################# */
/** School card — home / archive grid or marketplace grid. */
export function SchoolEntityCard({
  name = "Addis Ababa University",
  location = "Addis Ababa, Ethiopia",
  partnershipLabel = "Partnership",
  logoSrc = DEFAULT_SCHOOL_LOGO,
  ctaVariant = "portal",
}: SchoolEntityCardProps) {
  return (
    <Card className="rounded-xl p-4 shadow-none">
      <div className={logoShellClass} aria-hidden>
        <Image
          src={logoSrc}
          alt=""
          width={96}
          height={96}
          className="size-full object-contain object-center p-0.5"
          sizes="96px"
        />
      </div>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <Typography as="h2" variant="h3" className="min-w-0 text-lg font-bold">
          {name}
        </Typography>
        <Typography
          as="span"
          variant="label"
          className="inline-flex h-8 shrink-0 items-center rounded-full border border-border-default bg-surface-muted px-3 text-xs font-medium text-text-secondary"
        >
          Details
        </Typography>
      </div>
      <div className="flex flex-col gap-2 text-sm text-text-secondary sm:flex-row sm:items-center sm:justify-between">
        <span className="inline-flex items-center gap-1.5">
          <MapPin className="size-4 shrink-0" aria-hidden />
          {location}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Users className="size-4 shrink-0" aria-hidden />
          {partnershipLabel}
        </span>
      </div>
      {ctaVariant === "portal" ? (
        <Button type="button" variant="primary" className="mt-1 w-full gap-2">
          Go to School
          <ExternalLink className="size-4" aria-hidden />
        </Button>
      ) : null}
      {ctaVariant === "marketplace" ? (
        <Button
          type="button"
          variant="primary"
          className="mt-1 w-full bg-success-500 text-white hover:opacity-95 focus-visible:ring-2 focus-visible:ring-primary-300"
        >
          Buy
        </Button>
      ) : null}
      {ctaVariant === "archive" ? (
        <Button type="button" variant="secondary" className="mt-1 w-full">
          Restore
        </Button>
      ) : null}
    </Card>
  );
}
/** ################################ /COMPONENT ############################# */
