/** ################################ IMPORT ############################# */
/** Imports used by this file. */
import { cleanup, fireEvent, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { LandingPageView } from "@/modules/Feed/views/LandingPageView";
import { renderWithAppProviders } from "@/test/renderWithAppProviders";

/** ################################ /IMPORT ############################# */

/** ################################ COMPONENT ############################# */
/** Main exported component logic for this file. */
afterEach(() => {
  cleanup();
});

describe("LandingPageView", () => {
  it("toggles filter panel from trigger", () => {
    renderWithAppProviders(<LandingPageView />);

    expect(screen.queryByLabelText("Feed filters")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Filters" }));
    expect(screen.getByLabelText("Feed filters")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Filters" }));
    expect(screen.queryByLabelText("Feed filters")).not.toBeInTheDocument();
  });

  it("renders metadata and hashtags", () => {
    renderWithAppProviders(<LandingPageView />);

    expect(screen.getAllByText("Dr. Elena Vance").length).toBeGreaterThan(0);
    expect(screen.getByText("#NeuroTech")).toBeInTheDocument();
    expect(screen.getByText("Access Full Research Paper (PDF)")).toBeInTheDocument();
  });

  it("toggles action rail button pressed state", () => {
    renderWithAppProviders(<LandingPageView />);

    const likeButton = screen.getAllByRole("button", { name: "Like" })[0];
    expect(likeButton).toHaveAttribute("aria-pressed", "false");
    fireEvent.click(likeButton);
    expect(likeButton).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(likeButton);
    expect(likeButton).toHaveAttribute("aria-pressed", "false");
  });

  it("uses tuned preload strategy around active clip", () => {
    const { container } = renderWithAppProviders(<LandingPageView />);
    const videos = Array.from(container.querySelectorAll("video"));
    expect(videos.length).toBeGreaterThan(6);
    expect(videos[0]).toHaveAttribute("preload", "auto");
    expect(videos[6]).toHaveAttribute("preload", "metadata");
  });
});
/** ################################ /COMPONENT ############################# */
