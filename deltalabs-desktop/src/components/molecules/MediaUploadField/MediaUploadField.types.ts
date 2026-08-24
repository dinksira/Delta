import type { MediaAsset } from "@/modules/Competition/types/createBattle";

/** Default org slug used for media uploads when no org context is provided. */
export const DEFAULT_MEDIA_ORG_SLUG = "delta-labs";

export interface MediaUploadFieldProps {
  /** The resolved asset, or null when none has been set. */
  value: MediaAsset | null;
  onChange: (asset: MediaAsset | null) => void;
  /** Org used by the upload-intent pipeline; defaults to the Delta Labs org. */
  orgId?: string;
  disabled?: boolean;
  className?: string;
}