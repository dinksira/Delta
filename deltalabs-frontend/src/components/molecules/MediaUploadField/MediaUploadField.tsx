/**
 * MediaUploadField — upload-intent image field for the Design Canvas.
 *
 * Offers a token-styled upload zone (file picker) plus a paste-image-URL
 * fallback. Uploads run through the shared media pipeline
 * (`uploadDesignCoverMedia`: upload-intent → presigned PUT → complete) and emit
 * a `MediaAsset` via `onChange`. States: idle / uploading / ready / error
 * banner. Fully controlled via `value` + `onChange`.
 *
 * @example
 * <MediaUploadField
 *   value={question.design.cover}
 *   onChange={(cover) => onChange({ design: { ...question.design, cover } })}
 * />
 */

"use client";

import { useId, useRef, useState } from "react";
import { Image, Link2, Loader2, Plus, X } from "lucide-react";

import { Button } from "@/components/theme/Button";
import { Input } from "@/components/theme/Input";
import { Typography } from "@/components/theme/Typography";
import { uploadDesignCoverMedia } from "@/modules/Competition/api";
import { DEFAULT_MEDIA_ORG_SLUG, type MediaUploadFieldProps } from "./MediaUploadField.types";
import { cn } from "@/lib/utils";

/** True when the stored URL is not yet playable (media:// intent placeholder). */
function isUnresolvedUrl(url: string | null | undefined): boolean {
  return !url || url.startsWith("media://");
}

export function MediaUploadField({
  value,
  onChange,
  orgId = DEFAULT_MEDIA_ORG_SLUG,
  disabled = false,
  className,
}: Readonly<MediaUploadFieldProps>) {
  const inputId = useId();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [showUrl, setShowUrl] = useState(false);
  const [urlValue, setUrlValue] = useState("");

  const clearError = () => setError(null);

  const handleFile = async (file: File | undefined) => {
    if (!file || disabled) {
      return;
    }
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file (PNG, JPG, WebP…).");
      return;
    }
    setUploading(true);
    setError(null);
    try {
      const uploaded = await uploadDesignCoverMedia(orgId, file);
      onChange({ id: uploaded.mediaId, url: uploaded.url, kind: "image" });
      setPickerOpen(false);
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "Upload failed. Check media storage config or paste an image URL instead.",
      );
    } finally {
      setUploading(false);
    }
  };

  const handleUseUrl = () => {
    const trimmed = urlValue.trim();
    if (!trimmed) {
      return;
    }
    onChange({ id: `url_${Date.now()}`, url: trimmed, kind: "image" });
    setUrlValue("");
    setShowUrl(false);
    setPickerOpen(false);
    clearError();
  };

  const renderPicker = () => (
    <div className="flex flex-col gap-2">
      <label
        htmlFor={inputId}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border-default bg-surface-canvas px-4 py-8 text-center transition-colors",
          "hover:border-primary-400 hover:bg-primary-50 focus-within:ring-2 focus-within:ring-primary-200",
          disabled && "cursor-not-allowed opacity-60",
        )}
      >
        <input
          ref={fileInputRef}
          id={inputId}
          type="file"
          accept="image/*"
          disabled={disabled || uploading}
          className="sr-only"
          onChange={(event) => handleFile(event.target.files?.[0])}
        />
        <span className="flex size-10 items-center justify-center rounded-full bg-surface-muted">
          {uploading ? (
            <Loader2 className="size-5 animate-spin text-primary-600" aria-hidden />
          ) : (
            <Image className="size-5 text-primary-600" aria-hidden />
          )}
        </span>
        <Typography className="text-sm font-medium text-text-primary">
          {uploading ? "Uploading…" : "Click to upload a cover image"}
        </Typography>
        <Typography className="text-xs text-text-secondary">
          {value ? "Replace the current reference." : "Drag, drop or click to choose an image."}
        </Typography>
      </label>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={() => setShowUrl((open) => !open)}>
          <Link2 className="size-4" aria-hidden />
          {showUrl ? "Hide URL" : "Paste image URL"}
        </Button>
        {value && (
          <Button variant="ghost" size="sm" onClick={() => setPickerOpen(false)}>
            <X className="size-4" aria-hidden />
            Cancel
          </Button>
        )}
      </div>

      {showUrl && (
        <div className="flex items-center gap-2">
          <Input
            type="url"
            value={urlValue}
            onChange={(event) => setUrlValue(event.target.value)}
            placeholder="https://example.com/design.png"
            aria-label="Image URL"
            className="flex-1"
          />
          <Button size="sm" onClick={handleUseUrl} disabled={!urlValue.trim()}>
            Use
          </Button>
        </div>
      )}
    </div>
  );

  const renderPreview = () => {
    const unresolved = isUnresolvedUrl(value?.url);
    return (
      <div className="flex flex-col gap-2">
        <div className="overflow-hidden rounded-xl border border-border-default bg-surface-canvas">
          {unresolved ? (
            <div className="flex h-40 flex-col items-center justify-center gap-2 px-4 text-center">
              <Image className="size-6 text-primary-500" aria-hidden />
              <Typography className="text-xs text-text-secondary">
                Cover uploaded — preview available once transcoding completes.
              </Typography>
            </div>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element -- stable asset URL from the media API
            <img
              src={value?.url}
              alt="Design canvas reference"
              className="h-40 w-full object-cover"
            />
          )}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Typography className="text-xs text-text-secondary">
            {value?.kind === "image" ? "Image" : "Media"} reference set
          </Typography>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={() => setPickerOpen(true)}>
              <Plus className="size-4" aria-hidden />
              Replace
            </Button>
            <Button variant="ghost" size="sm" onClick={() => onChange(null)}>
              <X className="size-4" aria-hidden />
              Remove
            </Button>
          </div>
        </div>
        {error && renderError()}
      </div>
    );
  };

  const renderError = () => (
    <div
      role="alert"
      className="rounded-lg border border-warning-500/40 bg-warning-50 px-3 py-2 text-xs text-warning-700"
    >
      {error}
    </div>
  );

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {value && !pickerOpen ? renderPreview() : renderPicker()}
      {error && !value ? renderError() : null}
    </div>
  );
}

export default MediaUploadField;