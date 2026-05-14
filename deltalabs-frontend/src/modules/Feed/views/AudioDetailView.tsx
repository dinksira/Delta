"use client";

/** ################################ IMPORT ############################# */
import { useEffect, useMemo } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { isLikelyAudioMediaUrl } from "@/lib/feedItemRoutes";
import { Typography } from "@/components/theme";
import { cx } from "@/components/theme/utils";
import { usePersistentAudioPlayer, type PublicAudioTrackMeta } from "@/contexts/PersistentAudioPlayer_Context";
import { useFeedItem } from "@/modules/Feed/hooks/useFeedQueries";

/** ################################ /IMPORT ############################# */

/** ################################ HELPERS ############################# */
function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return "—";
  const s = Math.floor(seconds % 60);
  const m = Math.floor((seconds / 60) % 60);
  const h = Math.floor(seconds / 3600);
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

const HERO_GRADIENTS = [
  "from-slate-800 via-slate-900 to-black",
  "from-primary-900 via-slate-950 to-black",
  "from-emerald-900 via-slate-950 to-black",
] as const;

function ShimmerBlock({ className }: Readonly<{ className?: string }>) {
  return <div className={cx("dl-search-shimmer-surface rounded-md", className)} aria-hidden />;
}

/** ################################ /HELPERS ############################# */

/** ################################ COMPONENT ############################# */
/** Episode detail; playback + Spotify-style dock live in `PersistentAudioPlayerProvider`. */
export function AudioDetailView() {
  const router = useRouter();
  const params = useParams();
  const rawId = params.id;
  const itemId = typeof rawId === "string" ? decodeURIComponent(rawId) : Array.isArray(rawId) ? rawId[0] : "";

  const { data: clip, isPending, isError, refetch } = useFeedItem(itemId || undefined, Boolean(itemId));
  const { loadTrack } = usePersistentAudioPlayer();

  const heroClass = useMemo(() => {
    const tone = clip?.mediaTone ?? 0;
    return HERO_GRADIENTS[Math.abs(tone) % HERO_GRADIENTS.length];
  }, [clip?.mediaTone]);

  const loaded = !isPending && Boolean(clip);
  const loadFailed = !isPending && (isError || !clip);
  const isAudioItem =
    loaded && clip ? clip.contentType === "audio" || isLikelyAudioMediaUrl(clip.videoSrc) : false;
  const showContent = loaded && clip && isAudioItem;

  const audioPayload = useMemo((): PublicAudioTrackMeta | null => {
    if (!loaded || !clip) return null;
    if (!(clip.contentType === "audio" || isLikelyAudioMediaUrl(clip.videoSrc))) return null;
    return {
      id: clip.id,
      src: clip.videoSrc,
      title: clip.caption,
      artistsLabel: clip.hashtags.join(", "),
      durationS: clip.durationS,
      mediaTone: clip.mediaTone,
    };
  }, [
    loaded,
    clip?.id,
    clip?.videoSrc,
    clip?.caption,
    clip?.hashtags?.join("|"),
    clip?.durationS,
    clip?.mediaTone,
    clip?.contentType,
    clip,
  ]);

  useEffect(() => {
    if (!audioPayload) return;
    loadTrack(audioPayload);
  }, [audioPayload, loadTrack]);

  if (!itemId) {
    return (
      <div className="p-6">
        <Typography as="p" variant="body" className="text-text-secondary">
          Missing audio id.
        </Typography>
      </div>
    );
  }

  const metaLine =
    showContent && clip
      ? [clip.hashtags.slice(0, 2).join(" · "), formatDuration(clip.durationS ?? 0)].filter(Boolean).join(" · ")
      : "";

  return (
    <div className="min-h-0 flex-1 overflow-y-auto bg-surface-canvas">
      <div className={cx("relative px-4 pb-10 pt-6 text-white sm:px-8 sm:pb-12 sm:pt-10 bg-gradient-to-b", heroClass)}>
        <button
          type="button"
          onClick={() => router.back()}
          className="mb-6 inline-flex size-10 items-center justify-center rounded-full bg-black/30 text-white ring-1 ring-white/20 transition-colors hover:bg-black/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
          aria-label="Go back"
        >
          <ArrowLeft className="size-5" />
        </button>
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end">
          <div className="mx-auto size-44 shrink-0 overflow-hidden rounded-lg shadow-xl ring-1 ring-white/15 sm:mx-0 sm:size-52">
            {isPending ? (
              <ShimmerBlock className="h-full w-full rounded-lg" />
            ) : (
              <div className={cx("flex h-full w-full items-center justify-center bg-gradient-to-br text-lg font-bold", heroClass)}>
                ΔL
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1 space-y-2 pb-2 text-center sm:pb-6 sm:text-left">
            {isPending ? (
              <>
                <ShimmerBlock className="mx-auto h-3 w-16 sm:mx-0" />
                <ShimmerBlock className="mx-auto h-10 w-full max-w-xl sm:mx-0 sm:h-12" />
                <ShimmerBlock className="mx-auto mt-2 h-4 w-48 sm:mx-0" />
                <ShimmerBlock className="mx-auto mt-1 h-4 w-36 sm:mx-0" />
              </>
            ) : loadFailed ? (
              <div className="space-y-3">
                <Typography as="p" variant="body" className="text-white/90">
                  Could not load this audio item.
                </Typography>
                <button
                  type="button"
                  className="text-sm font-medium text-white underline decoration-white/50 hover:decoration-white"
                  onClick={() => void refetch()}
                >
                  Retry
                </button>
                <Link href="/audio" className="block text-sm text-white/85 hover:text-white">
                  Back to Audio
                </Link>
              </div>
            ) : clip && !isAudioItem ? (
              <div className="space-y-3">
                <Typography as="p" variant="body" className="text-white/90">
                  This item is not an audio episode.
                </Typography>
                <Link href="/audio" className="text-sm text-white/85 hover:text-white">
                  Back to Audio
                </Link>
              </div>
            ) : (
              <>
                <Typography as="p" variant="small" className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/75">
                  Audio
                </Typography>
                <Typography as="h1" variant="h2" className="text-3xl font-extrabold leading-tight sm:text-5xl">
                  {clip.caption}
                </Typography>
                {metaLine ? (
                  <Typography as="p" variant="body" className="text-sm text-white/80">
                    {metaLine}
                  </Typography>
                ) : null}
              </>
            )}
          </div>
        </div>
      </div>

      <div className="w-full px-4 py-6 text-left sm:px-8">
        {isPending ? (
          <div className="mr-auto max-w-xl space-y-3" aria-busy aria-label="Loading details">
            <ShimmerBlock className="h-4 w-24" />
            <ShimmerBlock className="h-4 w-full" />
            <ShimmerBlock className="h-4 w-full" />
            <ShimmerBlock className="h-4 w-4/5 max-w-lg" />
            <ShimmerBlock className="h-4 w-32" />
          </div>
        ) : showContent && clip ? (
          <div className="mr-auto max-w-xl space-y-4">
            <Typography as="h2" variant="label" className="text-text-primary">
              About
            </Typography>
            <Typography as="p" variant="body" className="text-sm leading-relaxed text-text-secondary">
              {clip.caption} — {clip.hashtags.join(", ")}.
            </Typography>
            {clip.pdfLabel ? (
              <Typography as="p" variant="small" className="text-text-secondary">
                Resource: {clip.pdfLabel}
              </Typography>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
/** ################################ /COMPONENT ############################# */
