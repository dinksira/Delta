"use client";

/** ################################ IMPORT ############################# */
/** React hooks, theme primitives, and School API types. */
import { useEffect, useLayoutEffect, useMemo, useState } from "react";
import {
  BarChart3,
  BriefcaseBusiness,
  Building2,
  CalendarClock,
  ChevronLeft,
  FileText,
  FolderKanban,
  GraduationCap,
  LibraryBig,
  MonitorCheck,
  Plus,
  Presentation,
  School,
  Upload,
  Users,
} from "lucide-react";

import { Button, DialogOverlay, DialogPanel, Field, Input, Select, Typography } from "@/components/theme";
import { useAuthSession } from "@/contexts/AuthSession_Context";
import { uploadSchoolDocumentFile, type SchoolCreateInputDto } from "@/modules/School/api";
/** ################################ /IMPORT ############################# */

/** ################################ TYPES ############################# */
/** Type definitions used in this file. */
type SchoolCreateWizardModalProps = Readonly<{
  open?: boolean;
  presentation?: "modal" | "page";
  orgId?: string | null;
  /** True while `/v1/orgs/me` is loading (page flow). */
  orgLoading?: boolean;
  /** Network / permission / missing-org / API errors from parent. */
  submitError?: string | null;
  submitting?: boolean;
  onClose: () => void;
  onSubmit: (payload: SchoolCreateInputDto) => void;
}>;

type PartnerDraft = Readonly<{
  fullName: string;
  email: string;
  ownershipPercentage: string;
}>;

type SchoolPartnerDraft = Readonly<{
  fullName: string;
  email: string;
  ownershipPercentage: string;
  shareAccesses: ShareAccessDraft[];
}>;

type DocumentDraft = Readonly<{
  title: string;
  url: string;
  uploadState?: "idle" | "uploading" | "uploaded" | "error";
}>;

type ShareAccessDraft = Readonly<{
  accessName: string;
  status: string;
}>;

type CustomFieldDraft = Readonly<{
  key: string;
  value: string;
}>;
/** ################################ /TYPES ############################# */

/** ################################ CONSTANTS ############################# */
/** Shared constants used by this file. */
const STEPS = ["School", "Partner Detail", "Partners", "Share", "Documents"] as const;
const STEP_HEADINGS = ["School Information", "Partner Detail", "Partners", "School Share", "Attach School Document"] as const;

const DEFAULT_SHARE_ACCESSES: ShareAccessDraft[] = [
  { accessName: "Root Department", status: "can_view" },
  { accessName: "Class", status: "can_view" },
  { accessName: "Project Management", status: "can_view" },
  { accessName: "Online Course Modules", status: "can_view" },
  { accessName: "Staff and Teacher", status: "can_view" },
  { accessName: "Student Management", status: "can_view" },
  { accessName: "Academic Management", status: "can_view" },
  { accessName: "Timetable and Scheduling", status: "can_view" },
  { accessName: "Parent Portal", status: "can_view" },
  { accessName: "Hostel and Transport", status: "can_view" },
  { accessName: "Data Analytics and Reports", status: "can_view" },
  { accessName: "Document Management", status: "can_view" },
];
const WIZARD_DRAFT_STORAGE_KEY = "dl.school.create.wizard.draft.v1";

function cloneDefaultShareAccesses(): ShareAccessDraft[] {
  return DEFAULT_SHARE_ACCESSES.map((access) => ({ ...access }));
}
/** ################################ /CONSTANTS ############################# */

/** ################################ HELPERS ############################# */
/** Helper utilities used by this file. */
function parseNumber(value: string): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function shareAccessIcon(accessName: string) {
  const normalized = accessName.trim().toLowerCase();
  if (normalized.includes("root")) return Building2;
  if (normalized.includes("class")) return School;
  if (normalized.includes("project")) return FolderKanban;
  if (normalized.includes("online")) return MonitorCheck;
  if (normalized.includes("staff")) return Users;
  if (normalized.includes("student")) return GraduationCap;
  if (normalized.includes("academic")) return LibraryBig;
  if (normalized.includes("timetable")) return CalendarClock;
  if (normalized.includes("parent")) return Users;
  if (normalized.includes("hostel")) return Building2;
  if (normalized.includes("analytics")) return BarChart3;
  if (normalized.includes("document")) return FileText;
  if (normalized.includes("activity")) return Presentation;
  return BriefcaseBusiness;
}

function displayNameFromSessionUser(user: {
  firstName: string;
  lastName: string;
  userName: string;
  email: string;
}): string {
  const combined = [user.firstName?.trim(), user.lastName?.trim()].filter(Boolean).join(" ").trim();
  if (combined.length > 0) return combined;
  if (user.userName?.trim()) return user.userName.trim();
  if (user.email?.trim()) return user.email.trim();
  return "Account owner";
}

function safeReadDraft(): Record<string, unknown> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(WIZARD_DRAFT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return parsed;
  } catch {
    return null;
  }
}
/** ################################ /HELPERS ############################# */

/** ################################ COMPONENT ############################# */
/** School creation wizard modal based on the provided multi-step design. */
export function SchoolCreateWizardModal({
  open = true,
  presentation = "modal",
  orgId,
  orgLoading = false,
  submitError: submitErrorProp = null,
  submitting = false,
  onClose,
  onSubmit,
}: SchoolCreateWizardModalProps) {
  const { session, isReady: authReady } = useAuthSession();
  /** After true, wizard state may differ from SSR (localStorage draft applied). Persist only then. */
  const [draftHydrated, setDraftHydrated] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [name, setName] = useState("");
  const [schoolType, setSchoolType] = useState("University");
  const [email, setEmail] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [customFieldDraft, setCustomFieldDraft] = useState<CustomFieldDraft>({ key: "", value: "" });
  const [customFields, setCustomFields] = useState<CustomFieldDraft[]>([]);
  const [partnerDraft, setPartnerDraft] = useState<PartnerDraft>({
    fullName: "",
    email: "",
    ownershipPercentage: "",
  });
  const [partners, setPartners] = useState<SchoolPartnerDraft[]>([]);
  const [selectedPartnerIndex, setSelectedPartnerIndex] = useState(0);

  const [documentDraft, setDocumentDraft] = useState<DocumentDraft>({
    title: "",
    url: "",
    uploadState: "idle",
  });
  const [documents, setDocuments] = useState<DocumentDraft[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [stepValidationError, setStepValidationError] = useState<string | null>(null);

  const ownershipTotal = useMemo(
    () => partners.reduce((sum, partner) => sum + parseNumber(partner.ownershipPercentage), 0),
    [partners],
  );
  const ownershipTotalLabel = ownershipTotal.toFixed(2).replace(/\.00$/, "");

  useLayoutEffect(() => {
    const initialDraft = safeReadDraft();
    if (!initialDraft) {
      setDraftHydrated(true);
      return;
    }
    if (typeof initialDraft.name === "string") setName(initialDraft.name);
    if (typeof initialDraft.schoolType === "string") setSchoolType(initialDraft.schoolType);
    if (typeof initialDraft.email === "string") setEmail(initialDraft.email);
    if (typeof initialDraft.logoUrl === "string") setLogoUrl(initialDraft.logoUrl);
    if (Array.isArray(initialDraft.customFields)) {
      setCustomFields(
        initialDraft.customFields.filter(
          (item): item is CustomFieldDraft =>
            typeof item === "object" &&
            item !== null &&
            typeof (item as CustomFieldDraft).key === "string" &&
            typeof (item as CustomFieldDraft).value === "string",
        ),
      );
    }
    const cf = initialDraft.customFieldDraft;
    if (typeof cf === "object" && cf !== null) {
      setCustomFieldDraft({
        key: typeof (cf as CustomFieldDraft).key === "string" ? (cf as CustomFieldDraft).key : "",
        value: typeof (cf as CustomFieldDraft).value === "string" ? (cf as CustomFieldDraft).value : "",
      });
    }
    const pd = initialDraft.partnerDraft;
    if (typeof pd === "object" && pd !== null) {
      setPartnerDraft({
        fullName: typeof (pd as PartnerDraft).fullName === "string" ? (pd as PartnerDraft).fullName : "",
        email: typeof (pd as PartnerDraft).email === "string" ? (pd as PartnerDraft).email : "",
        ownershipPercentage:
          typeof (pd as PartnerDraft).ownershipPercentage === "string"
            ? (pd as PartnerDraft).ownershipPercentage
            : "",
      });
    }
    if (Array.isArray(initialDraft.partners)) {
      setPartners(
        initialDraft.partners
          .filter(
            (item): item is PartnerDraft & { shareAccesses?: unknown } =>
              typeof item === "object" &&
              item !== null &&
              typeof (item as PartnerDraft).fullName === "string" &&
              typeof (item as PartnerDraft).email === "string" &&
              typeof (item as PartnerDraft).ownershipPercentage === "string",
          )
          .map((item) => {
            const shareAccesses = Array.isArray(item.shareAccesses)
              ? item.shareAccesses
                  .filter(
                    (access): access is ShareAccessDraft =>
                      typeof access === "object" &&
                      access !== null &&
                      typeof (access as ShareAccessDraft).accessName === "string" &&
                      typeof (access as ShareAccessDraft).status === "string",
                  )
                  .map((access) => ({ ...access }))
              : [];
            return {
              fullName: item.fullName,
              email: item.email,
              ownershipPercentage: item.ownershipPercentage,
              shareAccesses: shareAccesses.length > 0 ? shareAccesses : cloneDefaultShareAccesses(),
            };
          }),
      );
    }
    const dd = initialDraft.documentDraft;
    if (typeof dd === "object" && dd !== null) {
      setDocumentDraft({
        title: typeof (dd as DocumentDraft).title === "string" ? (dd as DocumentDraft).title : "",
        url: typeof (dd as DocumentDraft).url === "string" ? (dd as DocumentDraft).url : "",
        uploadState: "idle",
      });
    }
    if (Array.isArray(initialDraft.documents)) {
      setDocuments(
        initialDraft.documents.filter(
          (item): item is DocumentDraft =>
            typeof item === "object" &&
            item !== null &&
            typeof (item as DocumentDraft).title === "string" &&
            typeof (item as DocumentDraft).url === "string",
        ),
      );
    }
    setDraftHydrated(true);
  }, []);

  useEffect(() => {
    if (!draftHydrated || typeof window === "undefined") return;
    const draft = {
      name,
      schoolType,
      email,
      logoUrl,
      customFieldDraft,
      customFields,
      partnerDraft,
      partners,
      documentDraft: {
        title: documentDraft.title,
        url: documentDraft.url,
      },
      documents,
    };
    localStorage.setItem(WIZARD_DRAFT_STORAGE_KEY, JSON.stringify(draft));
  }, [
    customFields,
    customFieldDraft,
    documentDraft.title,
    documentDraft.url,
    documents,
    draftHydrated,
    email,
    logoUrl,
    name,
    partnerDraft,
    partners,
    schoolType,
  ]);

  useEffect(() => {
    if (partners.length === 0) {
      setSelectedPartnerIndex(0);
      return;
    }
    if (selectedPartnerIndex >= partners.length) {
      setSelectedPartnerIndex(partners.length - 1);
    }
  }, [partners.length, selectedPartnerIndex]);

  const nameError = name.trim().length === 0 ? "School name is required." : undefined;
  const typeError = schoolType.trim().length === 0 ? "School type is required." : undefined;
  const emailError =
    email.trim().length > 0 && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
      ? "Enter a valid email."
      : undefined;
  const partnerNameError =
    partnerDraft.fullName.trim().length === 0 ? "Partner full name is required." : undefined;
  const partnerEmailError =
    partnerDraft.email.trim().length === 0
      ? "Partner email is required."
      : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(partnerDraft.email.trim())
        ? "Enter a valid partner email."
        : undefined;
  const ownershipRemaining = 100 - ownershipTotal;
  const ownershipRemainingLabel = ownershipRemaining.toFixed(2).replace(/\.00$/, "");
  const creatorShareAssignable = ownershipRemaining > 0.001;
  const canAddCreatorAsOwner =
    authReady &&
    session?.user != null &&
    creatorShareAssignable &&
    Math.abs(ownershipTotal - 100) >= 0.001;
  const ownershipInputMax = Math.max(Math.min(ownershipRemaining, 100), 0);
  const partnerOwnershipValue = parseNumber(partnerDraft.ownershipPercentage);
  const partnerOwnershipError =
    partnerDraft.ownershipPercentage.trim().length === 0
      ? "Ownership percentage is required."
      : partnerOwnershipValue < 0 || partnerOwnershipValue > 100
        ? "Ownership must be between 0 and 100."
        : partnerOwnershipValue > Math.max(ownershipRemaining, 0)
          ? `Ownership exceeds remaining share (${ownershipRemainingLabel}%).`
          : undefined;
  const documentsUploading = documentDraft.uploadState === "uploading";
  const selectedPartner = partners[selectedPartnerIndex] ?? null;
  const selectedPartnerShareAccesses = selectedPartner?.shareAccesses ?? [];
  const selectedPartnerIsCreator =
    selectedPartner != null &&
    session?.user?.email?.trim().toLowerCase() === selectedPartner.email.trim().toLowerCase();
  const partnersMissingShareAccess = partners.filter((partner) => {
    if (session?.user?.email?.trim().toLowerCase() === partner.email.trim().toLowerCase()) return false;
    return partner.shareAccesses.length === 0;
  });

  const canContinue = useMemo(() => {
    if (stepIndex === 0) return !nameError && !typeError && !emailError;
    if (stepIndex === 1) return !partnerNameError && !partnerEmailError && !partnerOwnershipError;
    if (stepIndex === 2) return partners.length === 0 || Math.abs(ownershipTotal - 100) < 0.001;
    if (stepIndex === 3) return partners.length > 0 && partnersMissingShareAccess.length === 0;
    return true;
  }, [
    emailError,
    nameError,
    ownershipTotal,
    partnersMissingShareAccess.length,
    partnerEmailError,
    partnerNameError,
    partnerOwnershipError,
    partners.length,
    stepIndex,
    typeError,
  ]);
  const continueDisabledHint = useMemo(() => {
    if (canContinue) return null;
    if (stepIndex === 2) {
      return `Adjust owner shares to total exactly 100% (current: ${ownershipTotalLabel}%).`;
    }
    if (stepIndex === 3) {
      if (partners.length === 0) return "Add at least one partner before assigning school share.";
      return "Each partner must have school share permissions configured.";
    }
    return null;
  }, [canContinue, ownershipTotalLabel, partners.length, stepIndex]);

  async function handleAttachDocumentFile(file: File): Promise<void> {
    if (!orgId) {
      setUploadError("Organization context is missing. Reload and try again.");
      return;
    }
    setUploadError(null);
    setDocumentDraft((prev) => ({ ...prev, uploadState: "uploading" }));
    try {
      const uploaded = await uploadSchoolDocumentFile(orgId, file);
      setDocumentDraft((prev) => ({
        ...prev,
        title: prev.title.trim().length > 0 ? prev.title : file.name,
        url: uploaded.referenceUrl,
        uploadState: "uploaded",
      }));
    } catch {
      setDocumentDraft((prev) => ({ ...prev, uploadState: "error" }));
      setUploadError("Document upload failed. Please retry.");
    }
  }

  function appendCurrentPartnerDraft(): void {
    if (partnerNameError || partnerEmailError || partnerOwnershipError) return;
    if (partnerDraft.fullName.trim().length === 0) return;
    const nextOwnership = parseNumber(partnerDraft.ownershipPercentage).toString();
    setPartners((prev) => {
      const nextPartners = [
        ...prev,
        {
          fullName: partnerDraft.fullName.trim(),
          email: partnerDraft.email.trim(),
          ownershipPercentage: nextOwnership,
          shareAccesses: cloneDefaultShareAccesses(),
        },
      ];
      setSelectedPartnerIndex(nextPartners.length - 1);
      return nextPartners;
    });
    setPartnerDraft({ fullName: "", email: "", ownershipPercentage: "" });
  }

  function addCreatorAsOwnerWithRemainingShare(): void {
    const user = session?.user;
    if (!user) return;
    setPartners((prev) => {
      const creatorEmail = user.email.trim().toLowerCase();
      const filtered =
        creatorEmail.length > 0
          ? prev.filter((p) => p.email.trim().toLowerCase() !== creatorEmail)
          : prev;
      const nextTotal = filtered.reduce((sum, p) => sum + parseNumber(p.ownershipPercentage), 0);
      const myShare = 100 - nextTotal;
      if (myShare < 0.001) return filtered;
      const pctStr = myShare.toFixed(2).replace(/\.00$/, "");
      return [
        ...filtered,
        {
          fullName: displayNameFromSessionUser(user),
          email: user.email.trim(),
          ownershipPercentage: pctStr,
          shareAccesses: cloneDefaultShareAccesses(),
        },
      ];
    });
  }

  function resetDraftAndClose(): void {
    if (typeof window !== "undefined") {
      localStorage.removeItem(WIZARD_DRAFT_STORAGE_KEY);
    }
    onClose();
  }

  if (presentation === "modal" && !open) return null;

  return presentation === "modal" ? (
    <>
      <DialogOverlay onClose={onClose} />
      <div className="fixed inset-0 z-[1400] flex items-center justify-center p-4">
        <DialogPanel className="w-full max-w-6xl p-6" onClick={(e) => e.stopPropagation()}>
          {renderWizardContent()}
        </DialogPanel>
      </div>
    </>
  ) : (
    <div className="mx-auto w-full max-w-6xl px-6 py-8 md:px-10">
      <div className="w-full">{renderWizardContent()}</div>
    </div>
  );

  function renderWizardContent() {
    const leftShareAccesses = selectedPartnerShareAccesses
      .map((access, index) => ({ access, index }))
      .filter((item) => item.index % 2 === 0);
    const rightShareAccesses = selectedPartnerShareAccesses
      .map((access, index) => ({ access, index }))
      .filter((item) => item.index % 2 !== 0);

    return (
      <>
          {presentation === "page" ? (
            <button
              type="button"
              className="mb-6 inline-flex items-center gap-2 text-sm text-text-secondary transition-colors hover:text-text-primary"
              onClick={resetDraftAndClose}
            >
              <ChevronLeft className="size-4" aria-hidden />
              Back
            </button>
          ) : null}
          <Typography as="h3" className="mb-6 text-2xl font-semibold text-text-primary">
            {STEP_HEADINGS[stepIndex]}
          </Typography>
          {orgLoading ? (
            <Typography className="mb-4 text-xs text-text-secondary">
              Loading organization context...
            </Typography>
          ) : null}

          {stepIndex === 0 ? (
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
              <Field id="school-logo-url" label="School Logo">
                <div className="rounded-xl border border-dashed border-border-default bg-surface-muted/70 p-4">
                  <div className="mb-3 flex items-center gap-3 rounded-lg border border-border-default bg-surface-default px-3 py-2">
                    <span className="inline-flex size-8 items-center justify-center rounded-md bg-surface-muted">
                      <Upload className="size-4 text-text-secondary" aria-hidden />
                    </span>
                    <div className="min-w-0 flex-1">
                      <Typography className="text-xs font-semibold text-text-primary">Logo source</Typography>
                      <Typography className="text-[11px] text-text-secondary">
                        Paste a hosted logo URL for the school card.
                      </Typography>
                    </div>
                  </div>
                  <Input
                    id="school-logo-url"
                    placeholder="https://your-cdn/logo.png"
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                  />
                </div>
              </Field>
              <div />
              <Field id="school-name" label="School Name" errorMessage={nameError}>
                <Input
                  id="school-name"
                  placeholder="Enter school name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </Field>
              <Field id="school-type" label="School Type" errorMessage={typeError}>
                <Select id="school-type" value={schoolType} onChange={(e) => setSchoolType(e.target.value)}>
                  <option value="University">University</option>
                  <option value="College">College</option>
                  <option value="Academy">Academy</option>
                  <option value="High School">High School</option>
                </Select>
              </Field>
              <Field id="school-email" label="Email" className="md:col-span-2" errorMessage={emailError}>
                <Input
                  id="school-email"
                  type="email"
                  placeholder="school@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </Field>
              <Field id="school-custom" label="Add Custom Field" className="md:col-span-2">
                <div className="grid grid-cols-1 gap-2 md:grid-cols-[1fr_1fr_auto]">
                  <Input
                    id="school-custom-key"
                    placeholder="Field key (e.g. Accreditation)"
                    value={customFieldDraft.key}
                    onChange={(e) =>
                      setCustomFieldDraft((prev) => ({
                        ...prev,
                        key: e.target.value,
                      }))
                    }
                  />
                  <Input
                    id="school-custom-value"
                    placeholder="Field value (e.g. ABET)"
                    value={customFieldDraft.value}
                    onChange={(e) =>
                      setCustomFieldDraft((prev) => ({
                        ...prev,
                        value: e.target.value,
                      }))
                    }
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      const key = customFieldDraft.key.trim();
                      const value = customFieldDraft.value.trim();
                      if (key.length === 0 || value.length === 0) return;
                      setCustomFields((prev) => [...prev, { key, value }]);
                      setCustomFieldDraft({ key: "", value: "" });
                    }}
                  >
                    <Plus className="size-4" aria-hidden />
                    Add
                  </Button>
                </div>
                {customFields.length > 0 ? (
                  <div className="mt-2 grid grid-cols-1 gap-2 md:max-w-xl">
                    {customFields.map((item, index) => (
                      <div
                        key={`${item.key}-${item.value}-${index}`}
                        className="flex items-center justify-between rounded-lg border border-border-default px-3 py-2"
                      >
                        <Typography className="text-xs text-text-secondary">
                          <span className="font-semibold text-text-primary">{item.key}:</span> {item.value}
                        </Typography>
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() => setCustomFields((prev) => prev.filter((_, i) => i !== index))}
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : null}
              </Field>
            </div>
          ) : null}

          {stepIndex === 1 ? (
            <div className="grid grid-cols-1 gap-4">
              <Field id="partner-name" label="Full Name" errorMessage={partnerNameError}>
                <Input
                  id="partner-name"
                  placeholder="Enter here"
                  value={partnerDraft.fullName}
                  onChange={(e) => setPartnerDraft((prev) => ({ ...prev, fullName: e.target.value }))}
                />
              </Field>
              <Field id="partner-email" label="Email" errorMessage={partnerEmailError}>
                <Input
                  id="partner-email"
                  type="email"
                  placeholder="Enter here"
                  value={partnerDraft.email}
                  onChange={(e) => setPartnerDraft((prev) => ({ ...prev, email: e.target.value }))}
                />
              </Field>
              <Field
                id="partner-ownership"
                label="Ownership Percentage"
                errorMessage={partnerOwnershipError}
              >
                <div className="space-y-1">
                  <Input
                    id="partner-ownership"
                    type="number"
                    min={0}
                    max={ownershipInputMax}
                    placeholder="Enter here"
                    value={partnerDraft.ownershipPercentage}
                    onChange={(e) =>
                      setPartnerDraft((prev) => ({ ...prev, ownershipPercentage: e.target.value }))
                    }
                  />
                  <Typography
                    className={
                      ownershipRemaining < 0
                        ? "text-xs font-medium text-error-500"
                        : "text-xs text-text-secondary"
                    }
                  >
                    {ownershipRemaining < 0
                      ? `Owners are over-allocated by ${Math.abs(ownershipRemaining).toFixed(2).replace(/\.00$/, "")}%. Remove or adjust shares.`
                      : `${ownershipRemainingLabel}% still unallocated — usually your share. On the next step you can add yourself in one click.`}
                  </Typography>
                </div>
              </Field>
            </div>
          ) : null}

          {stepIndex === 2 ? (
            <div className="space-y-5">
              <Button
                type="button"
                variant="primary"
                className="min-w-[140px]"
                onClick={() => {
                  appendCurrentPartnerDraft();
                  setStepIndex(1);
                }}
              >
                <Plus className="size-4" aria-hidden />
                Add Owner
              </Button>
              <Typography className="text-sm text-text-secondary">
                Total ownership:{" "}
                <span
                  className={
                    Math.abs(ownershipTotal - 100) < 0.001
                      ? "font-semibold text-success-600"
                      : "font-semibold text-warning-600"
                  }
                >
                  {ownershipTotalLabel}%
                </span>
                {" "}({Math.abs(ownershipTotal - 100) < 0.001 ? "balanced" : "must equal 100%"})
              </Typography>
              {Math.abs(ownershipTotal - 100) >= 0.001 ? (
                <div className="rounded-xl border border-border-subtle bg-surface-muted/60 px-4 py-3">
                  <Typography className="text-sm text-text-primary">
                    Creator’s share (unallocated):{" "}
                    <span className="font-semibold tabular-nums">
                      {ownershipRemaining < 0 ? "—" : `${ownershipRemainingLabel}%`}
                    </span>
                  </Typography>
                  <Typography className="mt-1 text-xs text-text-secondary">
                    Co-owners are listed above; whatever is left is commonly yours. This button adds you to
                    the cap table with exactly that remainder (and replaces a previous row that used your
                    account email).
                  </Typography>
                  <Button
                    type="button"
                    variant="secondary"
                    className="mt-3"
                    disabled={!canAddCreatorAsOwner}
                    title={
                      !authReady
                        ? "Loading session…"
                        : !session?.user
                          ? "Sign in to add yourself from your profile."
                          : !creatorShareAssignable
                            ? "No remaining percentage to assign."
                            : undefined
                    }
                    onClick={addCreatorAsOwnerWithRemainingShare}
                  >
                    <Plus className="size-4" aria-hidden />
                    Add me as owner ({ownershipRemaining < 0 ? "0" : ownershipRemainingLabel}%)
                  </Button>
                </div>
              ) : null}
              <div className="grid grid-cols-1 gap-3 md:max-w-xl">
                {partners.map((partner, index) => (
                  <div
                    key={`${partner.fullName}-${index}`}
                    className="flex items-center justify-between rounded-xl border border-border-default bg-surface-default px-4 py-4 shadow-sm"
                  >
                    <div>
                      <Typography className="font-semibold text-text-primary">{partner.fullName}</Typography>
                      <Typography className="text-xs text-text-secondary">
                        {partner.ownershipPercentage || 0}% Ownership
                      </Typography>
                    </div>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => setPartners((prev) => prev.filter((_, i) => i !== index))}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
                {partners.length === 0 ? (
                  <Typography className="text-sm text-text-secondary">
                    No partners added yet. Add owner to continue.
                  </Typography>
                ) : null}
              </div>
            </div>
          ) : null}

          {stepIndex === 3 ? (
            <div className="space-y-5">
              <Field id="partner-share-target" label="Partner">
                <Select
                  id="partner-share-target"
                  value={selectedPartnerIndex.toString()}
                  onChange={(e) => setSelectedPartnerIndex(Number(e.target.value))}
                >
                  {partners.map((partner, index) => (
                    <option key={`${partner.email}-${index}`} value={index.toString()}>
                      {partner.fullName} ({partner.email})
                    </option>
                  ))}
                </Select>
              </Field>
              {selectedPartnerIsCreator ? (
                <Typography className="rounded-lg border border-border-subtle bg-surface-muted/60 px-4 py-3 text-sm text-text-secondary">
                  This partner matches your owner account and already has full owner access by default.
                </Typography>
              ) : null}
              <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                {[leftShareAccesses, rightShareAccesses].map((group, groupIndex) => (
                  <div key={`share-col-${groupIndex}`} className="overflow-hidden rounded-xl border border-border-default">
                    <div className="grid grid-cols-[1fr_auto] border-b border-border-default bg-surface-muted/70 px-4 py-3">
                      <Typography className="text-xs font-semibold tracking-wide text-text-secondary">
                        Access Name
                      </Typography>
                      <Typography className="text-xs font-semibold tracking-wide text-text-secondary">
                        Status
                      </Typography>
                    </div>
                    {group.map(({ access, index: originalIndex }) => {
                      const Icon = shareAccessIcon(access.accessName);
                      return (
                        <div
                          key={`${access.accessName}-${originalIndex}`}
                          className="grid grid-cols-[1fr_auto] items-center border-b border-border-subtle px-4 py-4 last:border-b-0"
                        >
                          <div className="inline-flex items-center gap-3">
                            <span className="inline-flex size-7 items-center justify-center rounded-md bg-primary-50 text-primary-700">
                              <Icon className="size-4" aria-hidden />
                            </span>
                            <Typography className="text-sm font-medium text-text-primary">{access.accessName}</Typography>
                          </div>
                          <Select
                            className="max-w-[150px]"
                            value={access.status}
                            disabled={selectedPartner == null || selectedPartnerIsCreator}
                            onChange={(e) => {
                              if (selectedPartner == null || originalIndex < 0) return;
                              setPartners((prev) =>
                                prev.map((partner, idx) => {
                                  if (idx !== selectedPartnerIndex) return partner;
                                  const nextShare = [...partner.shareAccesses];
                                  nextShare[originalIndex] = { ...nextShare[originalIndex], status: e.target.value };
                                  return { ...partner, shareAccesses: nextShare };
                                }),
                              );
                            }}
                          >
                            <option value="can_view">Can View</option>
                            <option value="can_edit">Can Edit</option>
                            <option value="can_manage">Can Manage</option>
                          </Select>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
              {partnersMissingShareAccess.length > 0 ? (
                <Typography className="text-xs text-warning-600">
                  Missing share setup for: {partnersMissingShareAccess.map((partner) => partner.fullName).join(", ")}.
                </Typography>
              ) : null}
            </div>
          ) : null}

          {stepIndex === 4 ? (
            <div className="space-y-6">
              <Field id="document-title" label="Document Title">
                <Input
                  id="document-title"
                  placeholder="Intellectual Property Agreement"
                  value={documentDraft.title}
                  onChange={(e) => setDocumentDraft((prev) => ({ ...prev, title: e.target.value }))}
                />
              </Field>
              <Field id="document-url" label="Document Upload / URL">
                <div className="rounded-xl border border-dashed border-border-default bg-surface-muted p-4">
                  <Typography className="mb-3 text-xs text-text-secondary">
                    Upload a document file or paste an existing document URL.
                  </Typography>
                  {!orgId ? (
                    <Typography className="mb-2 text-xs text-warning-600">
                      File upload is available after your first school exists (you need an organization for
                      media). Paste a public URL here, or add files after this school is created.
                    </Typography>
                  ) : null}
                  <div className="flex flex-col gap-2 md:flex-row">
                  <Input
                    id="document-url"
                    placeholder="Uploaded file reference or URL"
                    value={documentDraft.url}
                    onChange={(e) => setDocumentDraft((prev) => ({ ...prev, url: e.target.value }))}
                  />
                  <Input
                    id="document-file"
                    type="file"
                    disabled={!orgId || documentsUploading}
                    className="max-w-full md:max-w-[300px]"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      await handleAttachDocumentFile(file);
                      e.target.value = "";
                    }}
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={documentsUploading}
                    onClick={() => {
                      if (documentDraft.title.trim().length === 0) return;
                      if (documentDraft.url.trim().length === 0) return;
                      setDocuments((prev) => [...prev, documentDraft]);
                      setDocumentDraft({ title: "", url: "", uploadState: "idle" });
                    }}
                  >
                    Attach
                  </Button>
                </div>
                </div>
                {uploadError ? <Typography className="text-xs text-error-500">{uploadError}</Typography> : null}
                {documentsUploading ? (
                  <Typography className="text-xs text-text-secondary">Uploading document...</Typography>
                ) : null}
              </Field>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {documents.map((document, index) => (
                  <div
                    key={`${document.title}-${index}`}
                    className="rounded-xl border border-border-default bg-surface-default px-4 py-4 shadow-sm"
                  >
                    <Typography className="text-sm font-semibold text-text-primary">{document.title}</Typography>
                    <Typography className="mt-1 line-clamp-2 text-xs text-text-secondary">
                      {document.url || "No URL attached"}
                    </Typography>
                  </div>
                ))}
                {documents.length === 0 ? (
                  <Typography className="text-sm text-text-secondary">
                    Attach documents if available.
                  </Typography>
                ) : null}
              </div>
            </div>
          ) : null}

          <div className="mt-12 flex items-center justify-between border-t border-border-default pt-6">
            <div>
              {stepIndex > 0 ? (
                <Button type="button" variant="secondary" onClick={() => setStepIndex((prev) => prev - 1)}>
                  Back
                </Button>
              ) : (
                <Button type="button" variant="secondary" onClick={resetDraftAndClose}>
                  Cancel
                </Button>
              )}
            </div>
            <div className="flex items-center gap-3">
              {stepIndex < STEPS.length - 1 ? (
                <div className="flex flex-col items-end gap-1">
                  <Button
                    type="button"
                    variant="primary"
                    disabled={!canContinue}
                    title={!canContinue ? continueDisabledHint ?? undefined : undefined}
                    onClick={() => {
                      setStepValidationError(null);
                      if (stepIndex === 1 && partnerDraft.fullName.trim().length > 0) {
                        appendCurrentPartnerDraft();
                      }
                      if (stepIndex === 2 && Math.abs(ownershipTotal - 100) >= 0.001) {
                        setStepValidationError("Total partner ownership must equal 100% before continuing.");
                        return;
                      }
                      setStepIndex((prev) => prev + 1);
                    }}
                  >
                    Save and Continue
                  </Button>
                  {!canContinue && continueDisabledHint ? (
                    <Typography className="text-xs text-warning-600">{continueDisabledHint}</Typography>
                  ) : null}
                </div>
              ) : (
                <Button
                  type="button"
                  variant="primary"
                  disabled={submitting}
                  title={undefined}
                  onClick={() => {
                    setStepValidationError(null);
                    if (partners.length > 0 && Math.abs(ownershipTotal - 100) >= 0.001) {
                      setStepValidationError("Total partner ownership must equal exactly 100%.");
                      return;
                    }
                    onSubmit({
                      name: name.trim(),
                      school_type: schoolType.trim(),
                      email: email.trim() || undefined,
                      logo_url: logoUrl.trim() || undefined,
                      custom_fields: customFields.map((field) => ({
                        key: field.key.trim(),
                        value: field.value.trim(),
                      })),
                      partners: partners.map((partner) => ({
                        full_name: partner.fullName,
                        email: partner.email.trim() || undefined,
                        ownership_percentage: Number(partner.ownershipPercentage || 0),
                        share_accesses: partner.shareAccesses.map((access) => ({
                          access_name: access.accessName,
                          status: access.status,
                        })),
                      })),
                      documents: documents.map((document) => ({
                        title: document.title.trim(),
                        url: document.url.trim() || undefined,
                      })),
                    })
                  }}
                >
                  {submitting ? "Saving..." : "Done"}
                </Button>
              )}
            </div>
          </div>
          {submitErrorProp ?? stepValidationError ? (
            <Typography className="mt-3 text-sm text-error-500">
              {submitErrorProp ?? stepValidationError}
            </Typography>
          ) : null}

          <div className="mt-6 flex flex-wrap gap-2">
            {STEPS.map((label, index) => (
              <span
                key={label}
                className={[
                  "rounded-full px-3 py-1 text-xs",
                  index === stepIndex
                    ? "bg-primary-100 text-primary-700"
                    : "bg-surface-muted text-text-secondary",
                ].join(" ")}
              >
                {label}: {index < stepIndex ? "Done" : index === stepIndex ? "Active" : "Pending"}
              </span>
            ))}
          </div>
      </>
    );
  }
}
/** ################################ /COMPONENT ############################# */
