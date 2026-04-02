import { cleanup, fireEvent, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { renderWithAppProviders } from "@/test/renderWithAppProviders";
import { LoginPageView } from "@/modules/Feed/views/LoginPageView";
import { RecoverPageView } from "@/modules/Feed/views/RecoverPageView";
import { SignupPageView } from "@/modules/Feed/views/SignupPageView";

const pushMock = vi.fn();
const replaceMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock, replace: replaceMock }),
}));

afterEach(() => {
  cleanup();
  for (const key of ["dl.mock.auth.users.v1", "dl.mock.auth.recovery.v1", "dl.auth.session.v1"]) {
    localStorage.removeItem(key);
  }
});

describe("Auth flow views", () => {
  it("shows login validation and credential error banner states", async () => {
    renderWithAppProviders(<LoginPageView />);

    fireEvent.click(screen.getByRole("button", { name: "Login" }));
    const requiredAlerts = screen.getAllByRole("alert");
    expect(requiredAlerts).toHaveLength(2);
    expect(requiredAlerts.every((el) => el.textContent === "Required")).toBe(true);

    fireEvent.change(screen.getByLabelText("Email or phone number"), {
      target: { value: "fail@demo.com" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "NotRightPass1!" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Login" }));

    await waitFor(() => {
      expect(screen.getByText("Invalid email, phone, or password.")).toBeInTheDocument();
    });
  });

  it("keeps signup step state and blocks invalid transitions", async () => {
    renderWithAppProviders(<SignupPageView />);

    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getAllByText("Required").length).toBeGreaterThanOrEqual(3);

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
      expect(screen.getByRole("heading", { level: 1, name: "Enter your Date of birth" })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByLabelText("Day"));
    fireEvent.click(screen.getByRole("option", { name: "15" }));
    fireEvent.click(screen.getByLabelText("Month"));
    fireEvent.click(screen.getByRole("option", { name: "June" }));
    fireEvent.click(screen.getByLabelText("Year"));
    fireEvent.click(screen.getByRole("option", { name: "1995" }));
    fireEvent.click(screen.getByRole("button", { name: "Continue" }));

    await waitFor(() => {
      expect(screen.getByRole("heading", { level: 1, name: "Phone and email" })).toBeInTheDocument();
    });

    const phoneInput = screen.getByLabelText("Phone number");
    const emailInput = screen.getByLabelText("Email");
    // fireEvent.click on the submit control does not always dispatch submit in jsdom + React 19;
    // submitting the form directly exercises the same onSubmit handler.
    const signupForm = phoneInput.closest("form");
    expect(signupForm).toBeInstanceOf(HTMLFormElement);
    const signupFormEl = signupForm as HTMLFormElement;
    fireEvent.change(phoneInput, { target: { value: "12" } });
    fireEvent.change(emailInput, { target: { value: "not-email" } });
    await waitFor(() => {
      expect(phoneInput).toHaveValue("12");
      expect(emailInput).toHaveValue("not-email");
    });
    fireEvent.submit(signupFormEl);

    await waitFor(() => {
      expect(screen.getByText("Invalid phone number")).toBeInTheDocument();
      expect(screen.getByText("Invalid email address")).toBeInTheDocument();
    });

    const phoneOk = screen.getByLabelText("Phone number");
    const emailOk = screen.getByLabelText("Email");
    fireEvent.change(phoneOk, { target: { value: "+251911223344" } });
    fireEvent.change(emailOk, { target: { value: "abel@test.com" } });
    await waitFor(() => {
      expect(phoneOk).toHaveValue("+251911223344");
      expect(emailOk).toHaveValue("abel@test.com");
    });
    fireEvent.submit(signupFormEl);

    await waitFor(() => {
      expect(screen.getByRole("heading", { level: 1, name: "Verification code" })).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText("Verification code"), { target: { value: "99" } });
    fireEvent.click(screen.getByRole("button", { name: "Next" }));

    await waitFor(() => {
      expect(screen.getByText("Invalid verification code")).toBeInTheDocument();
    });
  });

  it("handles recover->reset->done transitions and password mismatch", async () => {
    renderWithAppProviders(<RecoverPageView />);

    fireEvent.click(screen.getByRole("button", { name: "Recover" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Required");

    fireEvent.change(screen.getByLabelText("Email or phone number"), {
      target: { value: "success@demo.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Recover" }));

    await waitFor(() => {
      expect(
        screen.getByText(
          "If an account exists for this email or phone, a verification code was sent.",
        ),
      ).toBeInTheDocument();
      expect(screen.getByText("Reset your password")).toBeInTheDocument();
    });

    "123456".split("").forEach((digit, index) => {
      fireEvent.change(screen.getByLabelText(`Digit ${index + 1} of 6`), {
        target: { value: digit },
      });
    });

    fireEvent.change(screen.getByLabelText("New password"), {
      target: { value: "Password123!" },
    });
    fireEvent.change(screen.getByLabelText("Confirm password"), {
      target: { value: "Password12345!" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Reset password" }));

    await waitFor(() => {
      expect(screen.getByText("Passwords do not match.")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByLabelText("Back"));
    expect(screen.getByText("Recover your account")).toBeInTheDocument();
  });
});
