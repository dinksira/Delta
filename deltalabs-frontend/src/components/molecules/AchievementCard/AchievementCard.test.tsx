/** ################################ IMPORT ############################# */
/** Imports used by this file. */
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { AchievementCard } from "./AchievementCard";
/** ################################ /IMPORT ############################# */

const BASE = {
  title: "First Steps",
  description: "Joined your first competition",
} as const;

describe("AchievementCard", () => {
  it("mutes a locked row but still advertises the prize", () => {
    render(<AchievementCard {...BASE} locked rewardEtb={10} />);

    const row = screen.getByText("First Steps").closest("[data-status]");
    expect(row).toHaveAttribute("data-status", "locked");
    expect(row).toHaveClass("opacity-60");
    expect(screen.getByText("10 ETB")).toBeInTheDocument();
  });

  it("shows the pending state for an unlocked, uncredited reward", () => {
    render(<AchievementCard {...BASE} rewardEtb={10} rewarded={false} />);

    const row = screen.getByText("First Steps").closest("[data-status]");
    expect(row).toHaveAttribute("data-status", "pending");
    expect(row).not.toHaveClass("opacity-60");
    expect(screen.getByText("10 ETB")).toBeInTheDocument();
    expect(screen.queryByText(/credited/)).not.toBeInTheDocument();
  });

  it("reads credited once the reward has been paid", () => {
    render(<AchievementCard {...BASE} rewardEtb={10} rewarded />);

    expect(screen.getByText("10 ETB credited")).toBeInTheDocument();
    const row = screen.getByText("First Steps").closest("[data-status]");
    expect(row).toHaveAttribute("data-status", "claimed");
  });

  it("hides the chip when no reward is given", () => {
    render(<AchievementCard {...BASE} rewarded />);

    expect(screen.queryByText(/ETB/)).not.toBeInTheDocument();
  });

  it("states the reward state for screen readers, not colour alone", () => {
    render(<AchievementCard {...BASE} rewardEtb={40} rewarded />);

    expect(screen.getByText("— credited to wallet")).toBeInTheDocument();
  });
});
