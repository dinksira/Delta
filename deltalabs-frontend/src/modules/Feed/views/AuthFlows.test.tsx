import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { LoginPageView } from "@/modules/Feed/views/LoginPageView";
import { RecoverPageView } from "@/modules/Feed/views/RecoverPageView";
import { SignupPageView } from "@/modules/Feed/views/SignupPageView";

const pushMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

afterEach(() => {
  cleanup();
});

describe("Auth flow views", () => {
  it("shows login validation and credential error banner states", async () => {
    render(<LoginPageView />);

    fireEvent.click(screen.getByRole("button", { name: "Login" }));
    expect(
      screen.getByText("Please enter both identifier and password."),
    ).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Email or phone number"), {
      target: { value: "fail@demo.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "wrong" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Login" }));

    await waitFor(() => {
      expect(
        screen.getByText(
          "Something went wrong. Please check your credentials and try again.",
        ),
      ).toBeInTheDocument();
    });
  });

  it("keeps signup step state and blocks invalid transitions", async () => {
    render(<SignupPageView />);

    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(
      screen.getByText("Please complete first name, last name, and user name."),
    ).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("First Name"), {
      target: { value: "Abel" },
    });
    fireEvent.change(screen.getByLabelText("Last Name"), {
      target: { value: "Bekele" },
    });
    fireEvent.change(screen.getByLabelText("User Name"), {
      target: { value: "abelb" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Next" }));

    await waitFor(() => {
      expect(screen.getByText("Verify your contact")).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText("Phone number"), {
      target: { value: "12" },
    });
    fireEvent.change(screen.getByLabelText("Verification code"), {
      target: { value: "99" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Next" }));

    expect(
      screen.getByText("Enter a valid phone number and OTP code."),
    ).toBeInTheDocument();
  });

  it("handles recover->reset->done transitions and password mismatch", async () => {
    render(<RecoverPageView />);

    fireEvent.change(screen.getByLabelText("Email or phone number"), {
      target: { value: "user@demo.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Recover" }));

    await waitFor(() => {
      expect(
        screen.getByText("Verification code sent. Please check your inbox."),
      ).toBeInTheDocument();
      expect(screen.getByText("Reset your password")).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText("New password"), {
      target: { value: "password123" },
    });
    fireEvent.change(screen.getByLabelText("Confirm password"), {
      target: { value: "password12345" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Reset password" }));

    await waitFor(() => {
      expect(
        screen.getByText("Password mismatch. Please make sure both values match."),
      ).toBeInTheDocument();
    });

    fireEvent.click(screen.getByLabelText("Back"));
    expect(screen.getByText("Recover your account")).toBeInTheDocument();
  });
});
