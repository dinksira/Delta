"use client";

import { useCallback, useState } from "react";

import { useParams } from "next/navigation";
import { ArrowLeft, Trophy, Users, Calendar } from "lucide-react";

import { Typography } from "@/components/theme/Typography";
import { Button } from "@/components/theme/Button";
import { cn } from "@/lib/utils";
import { MOCK_COMPETITIONS } from "@/modules/Competition/data/mockCompetitions";

export function CompetitionDetailPage() {
  const params = useParams();
  const competitionId = params?.id as string;
  const competition = MOCK_COMPETITIONS.find((c) => c.id === competitionId);

  const handleBack = useCallback(() => {
    window.history.back();
  }, []);

  if (!competition) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <Typography className="text-text-secondary">Competition not found</Typography>
      </div>
    );
  }

  return (
    <div className="mx-auto flex h-full max-w-4xl flex-col gap-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handleBack}
          className="inline-flex size-9 items-center justify-center rounded-xl text-text-secondary transition-colors hover:bg-surface-muted hover:text-text-primary"
        >
          <ArrowLeft className="size-5" />
        </button>
        <Typography as="h1" className="text-2xl font-semibold text-primary-600">
          {competition.title}
        </Typography>
      </div>

      {/* Hero banner */}
      <div
        className={cn(
          "relative flex h-48 items-end overflow-hidden rounded-2xl",
          !competition.backgroundImageUrl && "bg-gradient-to-br from-primary-800 via-primary-700 to-primary-900",
        )}
        style={
          competition.backgroundImageUrl
            ? { backgroundImage: `url(${competition.backgroundImageUrl})`, backgroundSize: "cover", backgroundPosition: "center" }
            : undefined
        }
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
        <div className="relative z-10 p-6">
          <Typography as="h2" className="text-3xl font-bold text-white">
            {competition.title}
          </Typography>
        </div>
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="flex items-center gap-3 rounded-xl border border-border-default bg-surface-default p-4">
          <Calendar className="size-5 text-primary-500" />
          <div>
            <Typography variant="small" className="text-text-secondary">Ends At</Typography>
            <Typography className="font-medium">{competition.endsAt}</Typography>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-border-default bg-surface-default p-4">
          <Users className="size-5 text-primary-500" />
          <div>
            <Typography variant="small" className="text-text-secondary">Participants</Typography>
            <Typography className="font-medium">{competition.participants}</Typography>
          </div>
        </div>
        <div className="flex items-center gap-3 rounded-xl border border-border-default bg-surface-default p-4">
          <Trophy className="size-5 text-primary-500" />
          <div>
            <Typography variant="small" className="text-text-secondary">Tags</Typography>
            <div className="flex flex-wrap gap-1 mt-0.5">
              {competition.tags.map((tag) => (
                <span key={tag} className="inline-flex rounded-full bg-primary-100 px-2 py-0.5 text-xs font-medium text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <Button variant="primary" size="lg">
          Join Competition
        </Button>
        <Button variant="secondary" size="lg">
          View Details
        </Button>
      </div>
    </div>
  );
}

export default CompetitionDetailPage;
