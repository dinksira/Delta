/** ################################ IMPORT ############################# */
/** Imports used by this file. */
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { AchievementsPanel } from "./AchievementsPanel";
import type { AchievementConfig } from "./AchievementsPanel";
import { formatETB } from "@/modules/Wallet";
/** ################################ /IMPORT ############################# */

/** ################################ HELPERS ############################# */
/** Achievement fixtures covering each reward state. */
function achievement(overrides: Partial<AchievementConfig> = {}): AchievementConfig {
  return {
    id: "first-battle",
    title: "First Steps",
    description: "Joined your first competition",
    unlocked: true,
    unlockedAt: "2026-10-08T10:00:00+00:00",
    rewardEtb: 10,
    rewarded: true,
    rewardedAt: "2026-10-08T10:00:00+00:00",
    ...overrides,
  };
}
/** ################################ /HELPERS ############################# */

describe("AchievementsPanel", () => {
  it("shows an empty state instead of rows when there is nothing yet", () => {
    render(<AchievementsPanel achievements={[]} />);

    expect(screen.getByText(/No achievements yet/)).toBeInTheDocument();
    expect(screen.queryByText("First Steps")).not.toBeInTheDocument();
    expect(screen.queryByText(/ETB earned/)).not.toBeInTheDocument();
  });

  it("sums only credited rewards into the earned pill", () => {
    render(
      <AchievementsPanel
        achievements={[
          achievement(),
          achievement({
            id: "champion",
            title: "Champion",
            rewardEtb: 100,
            unlocked: true,
            rewarded: false,
            rewardedAt: null,
          }),
        ]}
      />,
    );

    // 10 credited + 100 still pending = the pill reports 10, not 110.
    expect(screen.getByText(`${formatETB(10)} ETB earned`)).toBeInTheDocument();
    expect(screen.queryByText(`${formatETB(110)} ETB earned`)).not.toBeInTheDocument();
    expect(screen.getByText("Champion")).toBeInTheDocument();
  });

  it("omits the pill while nothing has been credited", () => {
    render(
      <AchievementsPanel
        achievements={[
          achievement({ unlocked: false, unlockedAt: null, rewarded: false, rewardedAt: null }),
        ]}
      />,
    );

    expect(screen.queryByText(/ETB earned/)).not.toBeInTheDocument();
    expect(screen.getByText("First Steps")).toBeInTheDocument();
  });

  it("passes the hub reward through to each row", () => {
    render(<AchievementsPanel achievements={[achievement({ rewardEtb: 40 })]} />);

    expect(screen.getByText("40 ETB credited")).toBeInTheDocument();
  });
});
