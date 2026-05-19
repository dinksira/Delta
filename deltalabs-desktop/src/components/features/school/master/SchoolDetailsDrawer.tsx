"use client";

/** ################################ IMPORT ############################# */
/** Imports used by this file. */
import Image from "next/image";
import {
  BadgeDollarSign,
  CalendarClock,
  Download,
  GraduationCap,
  MapPin,
  SquareArrowOutUpRight,
  UserRoundCog,
  Users,
  X,
} from "lucide-react";

import { Button, DialogOverlay, Typography } from "@/components/theme";
/** ################################ /IMPORT ############################# */

/** ################################ TYPES ############################# */
/** Type definitions used by this file. */
export type SchoolDetailsDrawerSchool = Readonly<{
  schoolId: string;
  orgId: string;
  name: string;
  schoolType: string;
  orgSlug: string;
  logoSrc?: string | null;
}>;

type SchoolDetailsDrawerProps = Readonly<{
  open: boolean;
  school: SchoolDetailsDrawerSchool | null;
  onClose: () => void;
  onArchive: (school: SchoolDetailsDrawerSchool) => void;
  onGoToSchool: (school: SchoolDetailsDrawerSchool) => void;
  onSellSchool?: (school: SchoolDetailsDrawerSchool) => void;
}>;
/** ################################ /TYPES ############################# */

/** ################################ CONSTANTS ############################# */
/** Shared constants used by this file. */
const DEFAULT_SCHOOL_LOGO = "/school/addis-ababa-university-logo.png";
/** ################################ /CONSTANTS ############################# */

/** ################################ COMPONENT ############################# */
/** Reusable right drawer for school details and quick actions. */
export function SchoolDetailsDrawer({
  open,
  school,
  onClose,
  onArchive,
  onGoToSchool,
  onSellSchool,
}: SchoolDetailsDrawerProps) {
  if (!open || school == null) return null;

  const logoSrc = school.logoSrc?.trim() ? school.logoSrc : DEFAULT_SCHOOL_LOGO;

  return (
    <>
      <DialogOverlay
        onClose={onClose}
        className="top-16 z-[1490] bg-black/30 backdrop-blur-[1px]"
      />
      <aside className="fixed right-0 top-16 z-[1500] flex h-[calc(100dvh-4rem)] w-full max-w-[470px] flex-col border-l border-border-default bg-surface-default shadow-2xl">
        <div className="flex items-center justify-between border-b border-border-default px-5 py-4">
          <div className="inline-flex h-7 items-center rounded-md border border-border-default px-2 text-xs text-text-secondary">
            Details
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex size-8 items-center justify-center rounded-md text-text-secondary transition-colors hover:bg-surface-muted"
            aria-label="Close details"
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>

        <div className="space-y-5 overflow-y-auto px-4 py-4">
          <div className="flex flex-col items-start gap-4 rounded-2xl border border-border-default bg-surface-default px-3 py-4">
            <div className="relative mx-auto size-36 overflow-hidden rounded-full border border-border-default bg-surface-default">
              <Image src={logoSrc} alt="" fill className="object-contain object-center p-1" sizes="144px" />
            </div>
            <div className="space-y-2">
              <Typography as="h3" className="text-[34px] font-semibold leading-[1.1] tracking-tight text-text-primary">
                {school.name}
              </Typography>
              <Typography className="inline-flex items-center gap-2 text-sm text-text-secondary">
                <MapPin className="size-4" aria-hidden />
                {school.schoolType} • Org: {school.orgSlug}
              </Typography>
              <button
                type="button"
                className="inline-flex items-center gap-2 text-sm font-medium text-primary-700 underline underline-offset-2"
              >
                <UserRoundCog className="size-4" aria-hidden />
                Change Partnership
              </button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 border-y border-border-default py-3">
            <div className="inline-flex items-center gap-2 text-sm text-text-secondary">
              <GraduationCap className="size-4" aria-hidden />
              <span>0 Students</span>
            </div>
            <div className="inline-flex items-center gap-2 text-sm text-text-secondary">
              <CalendarClock className="size-4" aria-hidden />
              <span>0 Teachers</span>
            </div>
            <div className="inline-flex items-center gap-2 text-sm text-text-secondary">
              <Users className="size-4" aria-hidden />
              <span>0 Staff</span>
            </div>
          </div>

          <div className="rounded-2xl border border-border-default px-4 py-4">
            <div className="mb-4 flex items-start justify-between gap-3">
              <Typography className="text-[30px] font-semibold leading-tight text-text-primary">
                Agreement
              </Typography>
              <button
                type="button"
                className="inline-flex size-8 items-center justify-center rounded-md border border-border-default text-text-secondary transition-colors hover:bg-surface-muted"
                aria-label="Download agreement"
              >
                <Download className="size-4" aria-hidden />
              </button>
            </div>
            <Typography className="inline-flex items-center gap-2 text-sm text-text-secondary">
              <CalendarClock className="size-4" aria-hidden />
              20/02/24
            </Typography>
          </div>
        </div>

        <div className="mt-auto space-y-3 border-t border-border-default px-4 py-4">
          <Button
            type="button"
            className="w-full gap-2 bg-success-600 text-white hover:bg-success-700"
            onClick={() => onSellSchool?.(school)}
          >
            <BadgeDollarSign className="size-4" aria-hidden />
            Sell School
          </Button>
          <div className="grid grid-cols-2 gap-3">
            <Button type="button" variant="secondary" className="w-full" onClick={() => onArchive(school)}>
              Archive
            </Button>
            <Button type="button" variant="primary" className="w-full gap-2" onClick={() => onGoToSchool(school)}>
              Go to School
              <SquareArrowOutUpRight className="size-4" aria-hidden />
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
}
/** ################################ /COMPONENT ############################# */

