import type { LandingVideoClip } from "@/modules/Feed/data/mockVideoFeed";

export function isLikelyAudioMediaUrl(src: string): boolean {
  return /\.(m4a|mp3|aac|wav|ogg|opus|flac)(\?|$)/i.test(src);
}

/** Detail route for a feed card when the app has a dedicated surface for that modality. */
export function feedItemDetailPath(clip: LandingVideoClip): string | null {
  const t = clip.contentType ?? "video";
  if (t === "audio" || isLikelyAudioMediaUrl(clip.videoSrc)) return `/audio/${encodeURIComponent(clip.id)}`;
  return null;
}
