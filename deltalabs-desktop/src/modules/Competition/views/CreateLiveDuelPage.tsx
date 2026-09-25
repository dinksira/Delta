/**
 * CreateLiveDuelPage
 * Host flow entry: renders the Live Duel setup form inside the create template
 * and, on "Go Live", creates the backend room (real chat + question fan-out)
 * and navigates straight into it — where the user is the live host and can post
 * questions in real time. Host identity comes from the auth session.
 *
 * @example
 * ```tsx
 * <CreateLiveDuelPage />
 * ```
 */

"use client";

import { useCallback, useState } from "react";

import { useRouter } from "next/navigation";

import { LiveDuelCreateTemplate } from "@/components/templates/LiveDuelCreateTemplate/LiveDuelCreateTemplate";
import { LiveDuelCreateForm } from "@/components/organisms/LiveDuelCreateForm/LiveDuelCreateForm";
import { createLiveDuelRoom, type CreateLiveDuelApiPayload } from "@/modules/Competition/api";
import { useAuthSession } from "@/contexts/AuthSession_Context";
import { upsertLiveDuelEntry } from "@/modules/Competition/data/liveDuelsCatalog";
import type { CreateLiveDuelInput } from "@/modules/Competition/data/liveDuelsCatalog";

export function CreateLiveDuelPage() {
  const router = useRouter();
  const { session } = useAuthSession();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const hostName = session?.user?.fullName || session?.user?.username || "Host";
  const hostAvatarUrl = session?.user?.avatarUrl ?? null;

  const handleBack = useCallback(() => {
    router.push("/features/competitions/live-duels");
  }, [router]);

  const handleGoLive = useCallback(
    async (input: CreateLiveDuelInput) => {
      setIsSubmitting(true);
      setSubmitError(null);
      try {
        // Rooms are backend-hosted; create returns the authoritative entry,
        // which is registered as host-owned so the room boots in host mode.
        const payload: CreateLiveDuelApiPayload = {
          title: input.title,
          subject: input.subject,
          difficulty: input.difficulty,
          durationLabel: input.durationLabel,
          entryFee: input.entryFee,
          prizePool: input.prizePool,
          playersMax: input.playersMax,
          hostName,
          hostAvatarUrl,
        };
        const remote = await createLiveDuelRoom(payload);
        upsertLiveDuelEntry({ ...remote, hostIsUser: true });
        router.push(`/features/competitions/live-duels/${remote.id}`);
      } catch {
        setSubmitError("Failed to go live. Please try again.");
        setIsSubmitting(false);
      }
    },
    [router, hostName, hostAvatarUrl],
  );

  return (
    <LiveDuelCreateTemplate
      onBack={handleBack}
      subtitle="Host your own arena — go live and post questions in real time"
    >
      <LiveDuelCreateForm
        hostName={hostName}
        hostAvatarUrl={hostAvatarUrl}
        onSubmit={handleGoLive}
        onCancel={handleBack}
        isSubmitting={isSubmitting}
        submitError={submitError}
      />
    </LiveDuelCreateTemplate>
  );
}

export default CreateLiveDuelPage;
