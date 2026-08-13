/**
 * DesignCanvasPreview — framed preview of a resolved design reference.
 *
 * Shows the uploaded cover fitted into a token-styled canvas frame on a
 * `surface-canvas` dotted backdrop, with the authored dimensions labelled
 * underneath. When no asset is set it renders a dashed placeholder that still
 * communicates the canvas size. Tokens only — no inline styles or arbitrary
 * values.
 *
 * @example
 * <DesignCanvasPreview asset={question.design.cover} width={1080} height={1080} />
 */

import { Image } from "lucide-react";

import { Typography } from "@/components/theme/Typography";
import type { MediaAsset } from "@/modules/Competition/types/createBattle";
import { cn } from "@/lib/utils";

export interface DesignCanvasPreviewProps {
  /** Cover / reference image to show in the frame. */
  asset: MediaAsset | null;
  /** Authored canvas width in px, displayed as the spec label. */
  width: number;
  /** Authored canvas height in px, displayed as the spec label. */
  height: number;
  className?: string;
}

function isResolvedUrl(url: string | null | undefined): boolean {
  return Boolean(url) && !url?.startsWith("media://");
}

export function DesignCanvasPreview({
  asset,
  width,
  height,
  className,
}: Readonly<DesignCanvasPreviewProps>) {
  const hasPreview = Boolean(asset) && isResolvedUrl(asset?.url);

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="overflow-hidden rounded-xl border border-border-default bg-surface-canvas">
        {hasPreview ? (
          <div className="flex aspect-square items-center justify-center p-2">
            {/* eslint-disable-next-line @next/next/no-img-element -- resolved media API asset */}
            <img
              src={asset?.url}
              alt="Uploaded design reference"
              className="max-h-full max-w-full rounded-md object-contain"
            />
          </div>
        ) : (
          <div className="flex aspect-square flex-col items-center justify-center gap-2 px-4 text-center">
            <span className="flex size-10 items-center justify-center rounded-full bg-surface-muted">
              <Image className="size-5 text-primary-600" aria-hidden />
            </span>
            <Typography className="text-sm font-medium text-text-primary">
              No reference image
            </Typography>
            <Typography className="text-xs text-text-secondary">
              Upload a cover so participants see the visual benchmark.
            </Typography>
          </div>
        )}
      </div>
      <Typography className="text-xs font-medium text-text-tertiary">
        Canvas size · {width} × {height} px
      </Typography>
    </div>
  );
}

export default DesignCanvasPreview;