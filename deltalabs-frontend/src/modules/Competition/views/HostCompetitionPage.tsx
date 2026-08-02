"use client";

import { useCallback } from "react";

import { useRouter } from "next/navigation";
import { Rocket } from "lucide-react";

import { BackButton } from "@/components/theme/BackButton";
import { Button } from "@/components/theme/Button";
import { Typography } from "@/components/theme/Typography";

export function HostCompetitionPage() {
  const router = useRouter();

  const handleBack = useCallback(() => {
    router.push("/features/competitions");
  }, [router]);

  const handleBrowse = useCallback(() => {
    router.push("/features/competitions/list");
  }, [router]);

  return (
    <div className="flex h-full flex-col overflow-y-auto p-4 md:p-6">
      <div className="flex items-center gap-3">
        <BackButton label="" onClick={handleBack} />
        <Typography as="h1" className="text-2xl font-semibold text-primary-600">
          Host Competition
        </Typography>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-border-default p-12 text-center">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-primary-100 text-primary-700 dark:bg-primary-900/40 dark:text-primary-300">
          <Rocket className="size-7" aria-hidden />
        </div>
        <div>
          <Typography as="h2" className="text-xl font-semibold text-text-primary">
            Competition hosting is coming soon
          </Typography>
          <Typography className="mt-2 max-w-md text-text-secondary">
            The 5-step wizard for building your competition — overview, prizes,
            timeline, terms, and workspace — is under construction. In the
            meantime, browse open competitions to join one.
          </Typography>
        </div>
        <Button variant="secondary" size="md" onClick={handleBrowse}>
          Browse Open Competitions
        </Button>
      </div>
    </div>
  );
}

export default HostCompetitionPage;
