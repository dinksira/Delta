"use client";

/** ################################ IMPORT ############################# */
/** Imports used by this file. */
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { HelpCircle, LogOut, Settings, UserRound, Users, Wallet } from "lucide-react";
import Image from "next/image";

import { LandingFeaturesIconSwitch } from "@/components/navigation/LandingFeaturesIconSwitch";
import { NavLanguageControl } from "@/components/navigation/NavLanguageControl";
import { useAuthSession } from "@/contexts/AuthSession_Context";
import { AUTH_SESSION_COOKIE } from "@/lib/authSession";
import { DialogHeader, DialogOverlay, DialogPanel, DialogSection } from "@/components/theme/Dialog";
import { AiAssistantModal } from "@/components/theme/AiAssistantModal";

/** ################################ /IMPORT ############################# */
/** ################################ TYPES ############################# */
/** Type definitions used in this file. */
type TopNavUtilityActionsProps = Readonly<{
  profileInitials?: string;
  avatarUrl?: string | null;
}>;

/** ################################ /TYPES ############################# */
/** ################################ CONSTANTS ############################# */
/** Shared stroke for utility-row icons (matches globe / square switch). */
const ICON_STROKE = 1.65;

/** ################################ /CONSTANTS ############################# */
/** ################################ SUBCOMPONENTS ############################# */
/** Robot + speech bubble — entry point for assistant chat (matches utility stroke weight). */
function NavRobotAssistantIcon({ className }: Readonly<{ className?: string }>) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M12 3.75v2.6"
        stroke="currentColor"
        strokeWidth={ICON_STROKE}
        strokeLinecap="round"
      />
      <circle cx="12" cy="2.85" r="1.15" fill="currentColor" />
      <rect
        x="5.85"
        y="7.1"
        width="12.3"
        height="10.6"
        rx="2.85"
        stroke="currentColor"
        strokeWidth={ICON_STROKE}
      />
      <circle cx="9.35" cy="11.85" r="1.2" fill="currentColor" />
      <circle cx="14.65" cy="11.85" r="1.2" fill="currentColor" />
      <path
        d="M13.15 15.1h4.35a.92.92 0 01.92.92v2.05a.92.92 0 01-.92.92h-2.55l-1.85 1.55v-1.55h-.38a.92.92 0 01-.92-.92v-2.05a.92.92 0 01.92-.92z"
        stroke="currentColor"
        strokeWidth={ICON_STROKE}
        strokeLinejoin="round"
      />
      <circle cx="15.05" cy="17.05" r="0.65" fill="currentColor" />
      <circle cx="16.75" cy="17.05" r="0.65" fill="currentColor" />
      <circle cx="18.45" cy="17.05" r="0.65" fill="currentColor" />
    </svg>
  );
}

const utilityGlyphClass = "size-8 shrink-0";
const utilitySlotClass = "inline-flex h-10 w-10 shrink-0 items-center justify-center";

type ProfileMenuModalProps = Readonly<{
  initials: string;
  avatarUrl?: string | null;
  onClose: () => void;
  onLogout: () => void;
}>;

type MenuRowProps = Readonly<{
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  variant?: "default" | "danger";
  onClick: () => void;
}>;

function MenuRow({ title, subtitle, icon, variant = "default", onClick }: MenuRowProps) {
  const danger = variant === "danger";
  return (
    <button
      type="button"
      className={[
        "group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40",
        danger ? "hover:bg-error-500/10" : "hover:bg-surface-muted",
      ].join(" ")}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
    >
      <span
        className={[
          "inline-flex size-9 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset",
          danger
            ? "bg-error-500/10 text-error-500 ring-error-500/20"
            : "bg-surface-default text-text-secondary ring-border-default",
        ].join(" ")}
        aria-hidden
      >
        <span className="size-5">{icon}</span>
      </span>
      <span className="min-w-0 flex-1">
        <span
          className={[
            "block truncate text-sm font-semibold",
            danger ? "text-error-500" : "text-text-primary",
          ].join(" ")}
        >
          {title}
        </span>
        {subtitle ? (
          <span className="block truncate text-xs text-text-secondary">{subtitle}</span>
        ) : null}
      </span>
      <span
        className="text-text-secondary/70 transition-transform group-hover:translate-x-0.5"
        aria-hidden
      >
        →
      </span>
    </button>
  );
}

function ProfileMenuModal({ initials, avatarUrl, onClose, onLogout }: ProfileMenuModalProps) {
  const router = useRouter();
  return (
    <DialogOverlay aria-label="Account menu" onClose={onClose}>
      <div className="absolute right-4 top-16 w-[21.5rem]">
        <DialogPanel onClick={(e) => e.stopPropagation()}>
          <DialogHeader className="bg-gradient-to-b from-surface-muted/70 to-surface-default px-4 pb-4 pt-4">
            <div className="flex items-center gap-3">
              <span className="inline-flex size-11 items-center justify-center overflow-hidden rounded-full border border-amber-200/90 bg-amber-100 text-sm font-semibold text-slate-800 shadow-sm">
                {avatarUrl ? (
                  <Image
                    src={avatarUrl}
                    alt=""
                    width={44}
                    height={44}
                    className="size-full object-cover"
                  />
                ) : (
                  initials
                )}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-text-primary">Account</p>
                <p className="truncate text-xs text-text-secondary">Quick actions and session</p>
              </div>
              <button
                type="button"
                className="inline-flex size-9 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40"
                aria-label="Close"
                onClick={(e) => {
                  e.stopPropagation();
                  onClose();
                }}
              >
                <span className="text-lg leading-none" aria-hidden>
                  ×
                </span>
              </button>
            </div>
          </DialogHeader>

          <DialogSection title="Quick actions">
            <MenuRow
              title="My profile"
              subtitle="View account details"
              icon={<UserRound className="size-5" />}
              onClick={() => {
                onClose();
                router.push("/profile");
              }}
            />
            <MenuRow
              title="Settings"
              subtitle="Personalize your experience"
              icon={<Settings className="size-5" />}
              onClick={() => {
                onClose();
                router.push("/settings");
              }}
            />
            <MenuRow
              title="Wallet"
              subtitle="Top up, withdraw & payment methods"
              icon={<Wallet className="size-5" />}
              onClick={() => {
                onClose();
                router.push("/wallet");
              }}
            />
            <MenuRow
              title="Help & support"
              subtitle="FAQ, contact, and resources"
              icon={<HelpCircle className="size-5" />}
              onClick={() => {
                onClose();
                // Link to help if exists, or just keep modal open for now
              }}
            />
          </DialogSection>

          <DialogSection title="Account Management">
            <MenuRow
              title="Switch account"
              subtitle="Log in to a different profile"
              icon={<Users className="size-5" />}
              onClick={() => {
                onClose();
                router.push("/settings?tab=account");
              }}
            />
          </DialogSection>

          <div className="border-t border-border-default bg-surface-muted/40 px-2 py-2">
            <MenuRow
              title="Log out"
              subtitle="End this session on this device"
              icon={<LogOut className="size-5" />}
              variant="danger"
              onClick={onLogout}
            />
          </div>
        </DialogPanel>
      </div>
    </DialogOverlay>
  );
}

/** ################################ /SUBCOMPONENTS ############################# */
/** ################################ COMPONENT ############################# */
/** Signed-in header: assistant entry, language, avatar, square switch — aligned 32px glyphs. */
export function TopNavUtilityActions({ profileInitials, avatarUrl }: TopNavUtilityActionsProps) {
  const router = useRouter();
  const { clearSession } = useAuthSession();
  const initials = (profileInitials ?? "U").slice(0, 2).toUpperCase();
  const [menuOpen, setMenuOpen] = useState(false);
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    };
    window.addEventListener("keydown", onEscape);
    return () => window.removeEventListener("keydown", onEscape);
  }, [menuOpen]);

  const handleLogout = () => {
    clearSession();
    document.cookie = `${AUTH_SESSION_COOKIE}=; Max-Age=0; path=/; SameSite=Lax`;
    setMenuOpen(false);
    router.replace("/");
    router.refresh();
  };

  return (
    <div className="flex h-10 items-center gap-2 sm:gap-2.5">
      <button
        type="button"
        className={`${utilitySlotClass} rounded-md text-white/90 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60`}
        aria-label="Open AI assistant"
        onClick={() => setAiModalOpen(true)}
      >
        <NavRobotAssistantIcon className={utilityGlyphClass} />
      </button>
      <NavLanguageControl tone="onPrimary" />
      <button
        ref={triggerRef}
        type="button"
        aria-label={`Profile menu: ${initials}`}
        aria-expanded={menuOpen}
        aria-haspopup="dialog"
        className="inline-flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-amber-200/90 bg-amber-100 text-xs font-semibold leading-none tracking-tight text-slate-800 shadow-sm transition-transform hover:scale-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 sm:text-sm"
        onClick={() => setMenuOpen((prev) => !prev)}
      >
        {avatarUrl ? (
          <Image src={avatarUrl} alt="" width={32} height={32} className="size-full object-cover" />
        ) : (
          initials
        )}
      </button>
      <span className="mx-1 h-7 w-px shrink-0 bg-white/40 sm:mx-1.5" aria-hidden />
      <LandingFeaturesIconSwitch />
      {menuOpen ? (
        <ProfileMenuModal
          initials={initials}
          avatarUrl={avatarUrl}
          onClose={() => {
            setMenuOpen(false);
            triggerRef.current?.focus();
          }}
          onLogout={handleLogout}
        />
      ) : null}
      {aiModalOpen ? (
        <AiAssistantModal isOpen={aiModalOpen} onClose={() => setAiModalOpen(false)} />
      ) : null}
    </div>
  );
}
/** ################################ /COMPONENT ############################# */
