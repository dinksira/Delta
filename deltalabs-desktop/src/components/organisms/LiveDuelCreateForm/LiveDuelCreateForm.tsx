/**
 * LiveDuelCreateForm
 * Host setup form for creating a new Live Duel, rendered inside
 * `LiveDuelCreateTemplate`. Collects the headline room details (title, subject,
 * difficulty, duration, entry fee, prize pool, player cap) and streams a live
 * preview of the resulting lobby card so the host sees exactly what the room
 * will look like in the list. "Go Live" registers the duel so the host lands in
 * their own room.
 *
 * @example
 * ```tsx
 * <LiveDuelCreateForm
 *   hostName="You"
 *   hostAvatarUrl={null}
 *   onSubmit={handleGoLive}
 *   submitError={submitError}
 * />
 * ```
 */

"use client";

import { useMemo, useState } from "react";

import { Radio } from "lucide-react";

import { Avatar } from "@/components/atoms/Avatar/Avatar";
import { LiveDuelCard } from "@/components/organisms/LiveDuelCard/LiveDuelCard";
import { Button } from "@/components/theme/Button";
import { Field } from "@/components/theme/Field";
import { Input } from "@/components/theme/Input";
import { Select } from "@/components/theme/Select";
import { StatusBanner } from "@/components/theme/StatusBanner";
import type { CreateLiveDuelInput } from "@/modules/Competition/data/liveDuelsCatalog";
import type { LiveDuelEntry } from "@/modules/Competition/types/liveDuel";
import { cn } from "@/lib/utils";

// ===== CONSTANTS =====

export const LIVE_DUEL_SUBJECTS = [
  "General",
  "Mathematics",
  "Physics",
  "Chemistry",
  "Biology",
  "History",
  "Geography",
  "Programming",
  "Literature",
  "Sports",
] as const;

export const LIVE_DUEL_DIFFICULTIES = ["Easy", "Medium", "Hard"] as const;
export const LIVE_DUEL_DURATIONS = ["30 min", "45 min", "60 min", "10 rounds"] as const;
export const LIVE_DUEL_ENTRY_FEES = ["Free", "50 ETB", "100 ETB", "200 ETB"] as const;

// ===== COMPONENT =====
export interface LiveDuelCreateFormProps {
  /** Host identity shown in the hosted-by row and used for the preview. */
  hostName: string;
  hostAvatarUrl?: string | null;
  onSubmit: (input: CreateLiveDuelInput) => void;
  onCancel?: () => void;
  isSubmitting?: boolean;
  submitError?: string | null;
  className?: string;
}

export function LiveDuelCreateForm({
  hostName,
  hostAvatarUrl,
  onSubmit,
  onCancel,
  isSubmitting = false,
  submitError = null,
  className,
}: Readonly<LiveDuelCreateFormProps>) {
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState<string>(LIVE_DUEL_SUBJECTS[0]);
  const [difficulty, setDifficulty] = useState<string>(LIVE_DUEL_DIFFICULTIES[1]);
  const [durationLabel, setDurationLabel] = useState<string>(LIVE_DUEL_DURATIONS[0]);
  const [entryFee, setEntryFee] = useState<string>(LIVE_DUEL_ENTRY_FEES[0]);
  const [prizePool, setPrizePool] = useState("");
  const [playersMax, setPlayersMax] = useState("20");

  const playersMaxParsed = Number.parseInt(playersMax, 10);
  const playersMaxValid = Number.isInteger(playersMaxParsed) && playersMaxParsed >= 2 && playersMaxParsed <= 100;
  const titleValid = title.trim().length > 0;
  const canSubmit = titleValid && playersMaxValid && !isSubmitting;

  const previewEntry = useMemo<LiveDuelEntry>(
    () => ({
      id: "preview",
      title: title.trim() || "Untitled Live Duel",
      subject,
      difficulty,
      status: "live",
      hostName,
      hostAvatarUrl: hostAvatarUrl ?? null,
      viewers: 0,
      playersJoined: 1,
      playersMax: playersMaxValid ? playersMaxParsed : 20,
      entryFee,
      prizePool: prizePool.trim() || "0 ETB",
      durationLabel,
    }),
    [title, subject, difficulty, durationLabel, entryFee, prizePool, playersMaxValid, playersMaxParsed, hostName, hostAvatarUrl],
  );

  const handleSubmit = () => {
    if (!canSubmit) {
      return;
    }
    onSubmit({
      title,
      subject,
      difficulty,
      durationLabel,
      entryFee,
      prizePool: prizePool.trim() || "0 ETB",
      playersMax: playersMaxParsed,
      hostName,
      hostAvatarUrl: hostAvatarUrl ?? null,
    });
  };

  return (
    <div className={cn("grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]", className)}>
      <form
        className="flex flex-col gap-5"
        onSubmit={(event) => {
          event.preventDefault();
          handleSubmit();
        }}
        noValidate
      >
        <div className="flex items-center gap-3">
          <Avatar name={hostName} src={hostAvatarUrl} size="sm" />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-text-primary">{hostName}</p>
            <p className="text-xs text-text-secondary">Hosting this duel</p>
          </div>
        </div>

        <Field id="live-duel-title" label="Duel title">
          <Input
            id="live-duel-title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="e.g. World History Rapid Fire"
            maxLength={80}
            required
          />
        </Field>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field id="live-duel-subject" label="Subject">
            <Select
              id="live-duel-subject"
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
            >
              {LIVE_DUEL_SUBJECTS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </Select>
          </Field>

          <Field id="live-duel-difficulty" label="Difficulty">
            <Select
              id="live-duel-difficulty"
              value={difficulty}
              onChange={(event) => setDifficulty(event.target.value)}
            >
              {LIVE_DUEL_DIFFICULTIES.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field id="live-duel-duration" label="Duration">
            <Select
              id="live-duel-duration"
              value={durationLabel}
              onChange={(event) => setDurationLabel(event.target.value)}
            >
              {LIVE_DUEL_DURATIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </Select>
          </Field>

          <Field id="live-duel-entry-fee" label="Entry fee">
            <Select
              id="live-duel-entry-fee"
              value={entryFee}
              onChange={(event) => setEntryFee(event.target.value)}
            >
              {LIVE_DUEL_ENTRY_FEES.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field id="live-duel-prize" label="Prize pool">
            <Input
              id="live-duel-prize"
              value={prizePool}
              onChange={(event) => setPrizePool(event.target.value)}
              placeholder="e.g. 5,000 ETB"
              maxLength={40}
            />
          </Field>

          <Field
            id="live-duel-players-max"
            label="Max players"
            errorMessage={playersMaxValid ? undefined : "Enter a number between 2 and 100"}
          >
            <Input
              id="live-duel-players-max"
              type="number"
              min={2}
              max={100}
              value={playersMax}
              onChange={(event) => setPlayersMax(event.target.value)}
            />
          </Field>
        </div>

        {submitError ? (
          <StatusBanner
            type="error"
            message={submitError}
            typeStyles={{
              success: "rounded-lg border border-success-500 bg-success-50 text-success-700",
              error: "rounded-lg border border-error-500 bg-error-50 text-error-700",
              info: "rounded-lg border border-info-500 bg-info-50 text-info-700",
            }}
          />
        ) : null}

        <div className="flex items-center justify-end gap-3 border-t border-border-default pt-4">
          {onCancel ? (
            <Button variant="ghost" onClick={onCancel} disabled={isSubmitting}>
              Cancel
            </Button>
          ) : null}
          <Button
            type="submit"
            variant="primary"
            size="lg"
            disabled={!canSubmit}
            className="min-w-44"
          >
            <Radio className="size-4" aria-hidden />
            {isSubmitting ? "Going live…" : "Go Live"}
          </Button>
        </div>
      </form>

      <aside className="flex flex-col gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-text-tertiary">
          Lobby card preview
        </p>
        <LiveDuelCard duel={previewEntry} />
        <p className="text-xs leading-relaxed text-text-secondary">
          This is how your duel appears in the Live Duels lobby once you go live.
        </p>
      </aside>
    </div>
  );
}

export default LiveDuelCreateForm;