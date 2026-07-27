import type { HostCompetitionDraft } from "@/modules/Competition/types/host";

export interface LaunchSummaryData {
  competitionName: string;
  startDate: string;
  phasesTotal: number;
  workspaceConfigured: boolean;
  prizeSummary: string;
  prizeType: "money" | "other" | "subscription" | "digital-product";
  rulesAdded: boolean;
}

export function deriveLaunchSummary(
  draft: HostCompetitionDraft,
): LaunchSummaryData {
  const dates = draft.timeline
    .map((p) => p.startDate)
    .filter(Boolean)
    .sort();

  const startDate =
    dates.length > 0
      ? dates[0]
      : "Not set";

  const firstPrize = draft.prizes[0];
  const prizeSummary = firstPrize
    ? firstPrize.type === "money"
      ? firstPrize.valueDescription
        ? `$${firstPrize.valueDescription}`
        : "Cash prize"
      : firstPrize.type === "subscription"
        ? firstPrize.valueDescription || "Subscription"
        : firstPrize.type === "digital-product"
          ? firstPrize.valueDescription || "Digital Product"
          : firstPrize.valueDescription || "Prize"
    : "None";

  return {
    competitionName: draft.overview.title || "Untitled Competition",
    startDate,
    phasesTotal: draft.timeline.length,
    workspaceConfigured: draft.workspace.selectedModule !== null,
    prizeSummary,
    prizeType: firstPrize?.type ?? "other",
    rulesAdded: draft.terms.agreed,
  };
}
