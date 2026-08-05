/**
 * PrivateMatchSettings
 * Atomic Level: Organism
 *
 * Conditional "Private Match Setting" panel for the Create Topic Battle wizard
 * (match type step). Smooth-expands inline between the visibility grid and the
 * "When to start Battle" section when the Private Match card is selected.
 *
 * Contains a shareable join code (with copy + regenerate actions) and an
 * invite-link field (with copy + "Copied!" feedback). The reveal uses a
 * pure-CSS grid-template-rows accordion (250ms ease-out) so the join code
 * state survives collapse/expand.
 */

import { useEffect, useRef, useState } from "react";
import { Check, Copy, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PrivateMatchSettingsProps } from "./PrivateMatchSettings.types";

const JOIN_CODE_LENGTH = 8;
const JOIN_CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const DEFAULT_INVITE_BASE_URL = "https://battlezone.app";
const COPY_FEEDBACK_MS = 1600;
const SPIN_MS = 600;

function generateJoinCode(): string {
  const bytes = new Uint8Array(JOIN_CODE_LENGTH);
  crypto.getRandomValues(bytes);
  let code = "";
  for (let i = 0; i < JOIN_CODE_LENGTH; i += 1) {
    code += JOIN_CODE_CHARS[bytes[i] % JOIN_CODE_CHARS.length];
  }
  return code;
}

async function copyText(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const el = document.createElement("textarea");
    el.value = text;
    el.setAttribute("readonly", "");
    el.style.position = "fixed";
    el.style.opacity = "0";
    document.body.appendChild(el);
    el.select();
    document.execCommand("copy");
    document.body.removeChild(el);
  }
}

export function PrivateMatchSettings({
  open,
  initialCode,
  inviteBaseUrl = DEFAULT_INVITE_BASE_URL,
  className,
}: Readonly<PrivateMatchSettingsProps>) {
  const [code, setCode] = useState(() => initialCode ?? generateJoinCode());
  const [copiedField, setCopiedField] = useState<"code" | "link" | null>(null);
  const [spinKey, setSpinKey] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const spinTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const inviteLink = `${inviteBaseUrl}/join/${code.toLowerCase()}`;

  useEffect(() => {
    return () => {
      if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
      if (spinTimer.current) clearTimeout(spinTimer.current);
    };
  }, []);

  const handleCopy = async (field: "code" | "link", text: string) => {
    await copyText(text);
    setCopiedField(field);
    if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    feedbackTimer.current = setTimeout(() => setCopiedField(null), COPY_FEEDBACK_MS);
  };

  const handleRegenerate = () => {
    setCode(generateJoinCode());
    setSpinKey((key) => key + 1);
    setSpinning(true);
    if (spinTimer.current) clearTimeout(spinTimer.current);
    spinTimer.current = setTimeout(() => setSpinning(false), SPIN_MS);
  };

  return (
    <div
      className={cn(
        "grid transition-[grid-template-rows,opacity] duration-[250ms] ease-out",
        open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
        className,
      )}
    >
      <div className="min-h-0 overflow-hidden" inert={!open} aria-hidden={!open}>
        <div className="mt-8">
          <section className="rounded-xl border border-border-default bg-surface-default p-6">
            <h3 className="mb-4 text-base font-bold text-primary-700">Private Match Setting</h3>

            <label htmlFor="join-code" className="mb-2 block text-[13px] font-semibold text-primary-700">
              Join Code
            </label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  id="join-code"
                  readOnly
                  value={code}
                  onFocus={(event) => event.target.select()}
                  className="h-11 w-full rounded-lg bg-surface-muted pr-11 font-mono text-sm font-medium tracking-[0.05em] text-primary-700 outline-none focus-visible:ring-2 focus-visible:ring-primary-400/60"
                />
                <button
                  type="button"
                  onClick={() => handleCopy("code", code)}
                  aria-label={copiedField === "code" ? "Join code copied" : "Copy join code"}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-primary-600 transition-colors duration-150 hover:bg-primary-100"
                >
                  {copiedField === "code" ? (
                    <Check className="size-4 text-success-600" aria-hidden />
                  ) : (
                    <Copy className="size-4" aria-hidden />
                  )}
                </button>
              </div>

              <button
                type="button"
                onClick={handleRegenerate}
                aria-label="Generate new join code"
                className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary-700 text-white transition-[filter] duration-200 hover:brightness-110"
              >
                <RefreshCw key={spinKey} className={cn("size-5", spinning && "animate-spin")} aria-hidden />
              </button>
            </div>
            <p className="mt-1.5 mb-4 text-xs text-text-secondary">
              Share this code with players to join your battle
            </p>

            <label htmlFor="invite-link" className="mb-2 block text-[13px] font-semibold text-primary-700">
              Invite Link
            </label>
            <div className="relative">
              <input
                id="invite-link"
                readOnly
                value={inviteLink}
                onFocus={(event) => event.target.select()}
                className="h-11 w-full rounded-lg bg-surface-muted pr-11 text-sm text-primary-600 outline-none focus-visible:ring-2 focus-visible:ring-primary-400/60"
              />
              <button
                type="button"
                onClick={() => handleCopy("link", inviteLink)}
                aria-label={copiedField === "link" ? "Invite link copied" : "Copy invite link"}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-primary-600 transition-colors duration-150 hover:bg-primary-100"
              >
                {copiedField === "link" ? (
                  <Check className="size-4 text-success-600" aria-hidden />
                ) : (
                  <Copy className="size-4" aria-hidden />
                )}
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export default PrivateMatchSettings;
