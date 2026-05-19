/** ################################ IMPORT ############################# */
/** Imports used by this file. */
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { EllipsisVertical, ExternalLink, MapPin, Pencil, Trash2, Users } from "lucide-react";

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
  id?: string;
  name?: string;
  location?: string;
  partnershipLabel?: string;
  /** Optional crest; defaults to Addis Ababa University asset in `/public/school`. */
  logoSrc?: string;
  /** Primary CTA — portal home uses primary; marketplace uses green Buy. */
  ctaVariant?: "portal" | "marketplace" | "archive";
  onPrimaryAction?: (id?: string) => void;
  onDetailsAction?: (id?: string) => void;
  onEditAction?: (id?: string) => void;
  onDeleteAction?: (id?: string) => void;
  primaryLabel?: string;
  ownerStatusBadge?: "Editable" | "Withdrawn" | "Sold" | null;
}>;

/** ################################ /TYPES ############################# */
/** ################################ COMPONENT ############################# */
/** School card — home / archive grid or marketplace grid. */
export function SchoolEntityCard({
  id,
  name = "Addis Ababa University",
  location = "Addis Ababa, Ethiopia",
  partnershipLabel = "Partnership",
  logoSrc = DEFAULT_SCHOOL_LOGO,
  ctaVariant = "portal",
  onPrimaryAction,
  onDetailsAction,
  onEditAction,
  onDeleteAction,
  primaryLabel,
  ownerStatusBadge = null,
}: SchoolEntityCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const canShowMenu = Boolean(onEditAction || onDeleteAction);

  useEffect(() => {
    if (!menuOpen) return;
    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (menuRef.current && target && !menuRef.current.contains(target)) {
        setMenuOpen(false);
      }
    };
    window.addEventListener("mousedown", handlePointerDown);
    return () => window.removeEventListener("mousedown", handlePointerDown);
  }, [menuOpen]);

  return (
    <Card className="relative rounded-xl p-4 shadow-none">
      {canShowMenu ? (
      <div className="absolute right-4 top-4 z-10" ref={menuRef}>
        <button
          type="button"
          aria-label="Open card menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((prev) => !prev)}
          className="inline-flex size-8 items-center justify-center rounded-md text-text-secondary transition-colors hover:bg-surface-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300"
        >
          <EllipsisVertical className="size-4" aria-hidden />
        </button>
        {menuOpen ? (
          <div className="absolute right-0 z-20 mt-2 min-w-[140px] overflow-hidden rounded-md border border-border-default bg-surface-default shadow-lg">
            {onEditAction ? (
              <button
                type="button"
                className="inline-flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-text-primary transition-colors hover:bg-surface-muted"
                onClick={() => {
                  onEditAction?.(id);
                  setMenuOpen(false);
                }}
              >
                <Pencil className="size-4" aria-hidden />
                Edit
              </button>
            ) : null}
            {onDeleteAction ? (
              <button
                type="button"
                className="inline-flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-error-600 transition-colors hover:bg-error-50"
                onClick={() => {
                  onDeleteAction?.(id);
                  setMenuOpen(false);
                }}
              >
                <Trash2 className="size-4" aria-hidden />
                Delete
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
      ) : null}
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
      <div className="flex items-center justify-between gap-3">
        <Typography as="h2" variant="h3" className="min-w-0 flex-1 pr-10 text-lg font-bold">
          {name}
        </Typography>
        <button
          type="button"
          onClick={() => onDetailsAction?.(id)}
          className="ml-auto inline-flex h-8 shrink-0 items-center rounded-full border border-border-default bg-surface-muted px-3 text-xs font-medium text-text-secondary transition-colors hover:bg-surface-default focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-300"
        >
          Details
        </button>
      </div>
      {ownerStatusBadge ? (
        <div className="mt-1">
          <span className="inline-flex items-center rounded-full border border-border-default bg-surface-muted px-2.5 py-1 text-xs font-medium text-text-secondary">
            {ownerStatusBadge}
          </span>
        </div>
      ) : null}
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
        <Button
          type="button"
          variant="primary"
          className="mt-1 w-full gap-2"
          onClick={() => onPrimaryAction?.(id)}
        >
          {primaryLabel ?? "Go to School"}
          <ExternalLink className="size-4" aria-hidden />
        </Button>
      ) : null}
      {ctaVariant === "marketplace" ? (
        <Button
          type="button"
          variant="primary"
          className="mt-1 w-full bg-success-500 text-white hover:opacity-95 focus-visible:ring-2 focus-visible:ring-primary-300"
          onClick={() => onPrimaryAction?.(id)}
        >
          {primaryLabel ?? "Buy"}
        </Button>
      ) : null}
      {ctaVariant === "archive" ? (
        <Button
          type="button"
          variant="secondary"
          className="mt-1 w-full"
          onClick={() => onPrimaryAction?.(id)}
        >
          {primaryLabel ?? "Restore"}
        </Button>
      ) : null}
    </Card>
  );
}
/** ################################ /COMPONENT ############################# */
