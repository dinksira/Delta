/** @vitest-environment jsdom */
import React from "react";

import { act, render, renderHook, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { HireTutorForm } from "./HireTutorForm";
import { HIRE_TUTOR_PAYMENT_OPTIONS, TUTOR_HOURLY_RATE } from "./hireTutorData";
import { useHireTutorForm } from "./useHireTutorForm";
/** ################################ TESTS ############################# */
/** Tests for the Hire a Tutor feature. */

/** A blank form with one tutor preselected, to isolate other concerns. */
function renderForm(overrides: Parameters<typeof HireTutorForm>[0] = {}) {
  return render(<HireTutorForm {...overrides} />);
}

describe("useHireTutorForm", () => {
  it("starts blank with no dialog open", () => {
    const { result } = renderHook(() => useHireTutorForm());

    expect(result.current.form.description).toBe("");
    expect(result.current.form.tutorIds).toEqual([]);
    expect(result.current.openDialog).toBeNull();
    expect(result.current.isComplete).toBe(false);
  });

  it("accepts initial state", () => {
    const { result } = renderHook(() =>
      useHireTutorForm({ initialState: { description: "help with algebra" } }),
    );

    expect(result.current.form.description).toBe("help with algebra");
  });

  it("publishes every change through onChange", () => {
    const onChange = vi.fn();
    const { result } = renderHook(() => useHireTutorForm({ onChange }));

    act(() => result.current.setDescription("derivatives"));

    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ description: "derivatives" }),
    );
  });

  it("toggles a tutor on and off by id", () => {
    const { result } = renderHook(() => useHireTutorForm());

    act(() => result.current.toggleTutor("tutor-amara"));
    expect(result.current.form.tutorIds).toEqual(["tutor-amara"]);

    act(() => result.current.toggleTutor("tutor-amara"));
    expect(result.current.form.tutorIds).toEqual([]);
  });

  it("replaces the invited tutors on confirm", () => {
    const { result } = renderHook(() =>
      useHireTutorForm({ initialState: { tutorIds: ["tutor-amara"] } }),
    );

    act(() => result.current.confirmTutors(["tutor-lina", "tutor-tomas"]));

    expect(result.current.form.tutorIds).toEqual(["tutor-lina", "tutor-tomas"]);
  });

  it("clears the time slot when the date changes", () => {
    const { result } = renderHook(() =>
      useHireTutorForm({
        initialState: { scheduledDate: "2026-04-01", scheduledTime: "09:00" },
      }),
    );

    act(() => result.current.setScheduledDate("2026-04-02"));

    expect(result.current.form.scheduledDate).toBe("2026-04-02");
    expect(result.current.form.scheduledTime).toBe("");
  });

  it("stores the payment option id and exposes the option", () => {
    const { result } = renderHook(() => useHireTutorForm());

    act(() => result.current.setPaymentOption(HIRE_TUTOR_PAYMENT_OPTIONS[1]));

    expect(result.current.form.paymentOptionId).toBe(HIRE_TUTOR_PAYMENT_OPTIONS[1].id);
    expect(result.current.selectedPaymentOption?.id).toBe(HIRE_TUTOR_PAYMENT_OPTIONS[1].id);
  });

  it("applies a whole roadmap selection", () => {
    const { result } = renderHook(() => useHireTutorForm());

    act(() =>
      result.current.applyRoadmapSelection({
        sectionIds: ["foundations"],
        resourceIds: ["foundations-notes"],
      }),
    );

    expect(result.current.form.roadmapSectionIds).toEqual(["foundations"]);
    expect(result.current.form.roadmapResourceIds).toEqual(["foundations-notes"]);
  });

  it("derives the estimate from the rate once a method is chosen", () => {
    const { result } = renderHook(() => useHireTutorForm());

    expect(result.current.estimatedAmount).toBe(0);

    act(() => result.current.setPaymentOption(HIRE_TUTOR_PAYMENT_OPTIONS[0]));

    expect(result.current.estimatedAmount).toBe(TUTOR_HOURLY_RATE * result.current.sessionHours);
  });

  it("prefers a typed amount over the derived one", () => {
    const { result } = renderHook(() =>
      useHireTutorForm({ initialState: { paymentOptionId: "card" } }),
    );

    act(() => result.current.setAmount("150"));

    expect(result.current.estimatedAmount).toBe(150);
  });

  it("falls back to the rate when the typed amount is cleared", () => {
    const { result } = renderHook(() =>
      useHireTutorForm({ initialState: { paymentOptionId: "card", amount: "150" } }),
    );

    act(() => result.current.setAmount(""));

    expect(result.current.estimatedAmount).toBe(TUTOR_HOURLY_RATE * result.current.sessionHours);
  });

  it("is complete once every required answer is present", () => {
    const { result } = renderHook(() => useHireTutorForm());

    act(() => result.current.setDescription("algebra help"));
    expect(result.current.isComplete).toBe(false);

    act(() => result.current.setScheduledDate("2026-04-01"));
    act(() => result.current.setPaymentOption(HIRE_TUTOR_PAYMENT_OPTIONS[0]));
    expect(result.current.isComplete).toBe(false);

    act(() => result.current.confirmTutors(["tutor-amara"]));
    expect(result.current.isComplete).toBe(true);
  });

  it("treats auto match as satisfying the tutor requirement", () => {
    const { result } = renderHook(() =>
      useHireTutorForm({
        initialState: {
          description: "algebra help",
          scheduledDate: "2026-04-01",
          paymentOptionId: "card",
        },
      }),
    );

    expect(result.current.isComplete).toBe(false);

    act(() => result.current.setAutoMatch(true));
    expect(result.current.isComplete).toBe(true);
  });

  it("ignores a whitespace-only description when judging completeness", () => {
    const { result } = renderHook(() =>
      useHireTutorForm({
        initialState: {
          description: "   ",
          scheduledDate: "2026-04-01",
          paymentOptionId: "card",
          tutorIds: ["tutor-amara"],
        },
      }),
    );

    expect(result.current.isComplete).toBe(false);
  });

  it("resets to the blank form", () => {
    const { result } = renderHook(() =>
      useHireTutorForm({ initialState: { description: "x", amount: "20" } }),
    );

    act(() => result.current.reset());

    expect(result.current.form.description).toBe("");
    expect(result.current.form.amount).toBe("");
  });

  it("opens and closes pickers", () => {
    const { result } = renderHook(() => useHireTutorForm());

    act(() => result.current.openPicker("roadmap"));
    expect(result.current.openDialog).toBe("roadmap");

    act(() => result.current.closePicker());
    expect(result.current.openDialog).toBeNull();
  });
});

describe("HireTutorForm", () => {
  it("renders the heading and both columns", () => {
    renderForm({ title: "Hire a tutor" });

    expect(screen.getByRole("heading", { name: "Hire a tutor" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Lesson details" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Session and payment" })).toBeInTheDocument();
    expect(screen.getByLabelText("Description")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Choose a date and time" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Choose a payment option" })).toBeInTheDocument();
  });

  it("blocks submission until the form is complete, and says why", () => {
    renderForm();

    expect(screen.getByRole("button", { name: "Request tutor" })).toBeDisabled();
    expect(screen.getByText(/Add a description, a date, a payment option/)).toBeInTheDocument();
  });

  it("records the typed description", async () => {
    const user = userEvent.setup();
    renderForm();

    await user.type(screen.getByLabelText("Description"), "need help with integrals");

    expect(screen.getByLabelText("Description")).toHaveValue("need help with integrals");
  });

  it("shows the scheduled date on the trigger once chosen", () => {
    renderForm({
      initialState: { scheduledDate: "2026-04-01", scheduledTime: "09:00" },
    });

    expect(screen.getByRole("button", { name: "Choose a date and time" })).toHaveTextContent(
      "2026-04-01 at 09:00",
    );
  });

  it("names the chosen payment method on its trigger", () => {
    renderForm({ initialState: { paymentOptionId: "wallet" } });

    expect(screen.getByRole("button", { name: "Choose a payment option" })).toHaveTextContent(
      "Mobile wallet",
    );
  });

  it("reports zero until a payment method is chosen", () => {
    renderForm();

    expect(screen.getByText("Estimated total")).toBeInTheDocument();
    expect(screen.getByText(/\$0\.00/)).toBeInTheDocument();
  });

  it("shows the derived total once a payment method is chosen", () => {
    renderForm({ initialState: { paymentOptionId: "card" } });

    expect(screen.getByText(`$${TUTOR_HOURLY_RATE * 2}.00 · 2h`)).toBeInTheDocument();
  });

  it("opens the payment picker and records the selection", async () => {
    const user = userEvent.setup();
    renderForm();

    await user.click(screen.getByRole("button", { name: "Choose a payment option" }));

    const list = await screen.findByRole("listbox", { name: "Payment option" });
    await user.click(screen.getByRole("option", { name: /Bank transfer/ }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Choose a payment option" })).toHaveTextContent(
        "Bank transfer",
      );
    });
    expect(list).toBeInTheDocument();
  });

  it("summarises the attached selections", () => {
    renderForm({
      initialState: {
        customParameters: [{ id: "1", name: "Session length", value: "90 minutes" }],
        roadmapSectionIds: ["foundations"],
        roadmapResourceIds: ["foundations-notes", "practice-drill"],
        tutorIds: ["tutor-amara", "tutor-daniel"],
      },
    });

    expect(screen.getByText("Session length")).toBeInTheDocument();
    expect(screen.getByText("3 selected")).toBeInTheDocument();
    expect(screen.getByText("2 invited")).toBeInTheDocument();
  });

  it("opens the custom parameters dialog from its row", async () => {
    const user = userEvent.setup();
    renderForm();

    await user.click(screen.getByRole("button", { name: /Add custom parameter/ }));

    expect(await screen.findByRole("dialog", { name: "Custom parameters" })).toBeInTheDocument();
  });

  it("opens the roadmap dialog from its row", async () => {
    const user = userEvent.setup();
    renderForm();

    await user.click(screen.getByRole("button", { name: /Select roadmap/ }));

    expect(await screen.findByRole("dialog", { name: "Select roadmap items" })).toBeInTheDocument();
  });

  it("opens the tutor dialog from its row and confirms a choice", async () => {
    const user = userEvent.setup();
    renderForm();

    await user.click(screen.getByRole("button", { name: /Invite tutor/ }));
    const dialog = await screen.findByRole("dialog", { name: "Select tutors" });

    await user.click(within(dialog).getByRole("button", { name: /Amara Osei/ }));
    await user.click(within(dialog).getByRole("button", { name: /^Invite/ }));

    await waitFor(() => expect(dialog).not.toBeInTheDocument());
    expect(screen.getByText("1 invited")).toBeInTheDocument();
  });

  it("keeps submission closed when no handler will receive the request", () => {
    renderForm({
      initialState: {
        description: "need help with integrals",
        scheduledDate: "2026-04-01",
        paymentOptionId: "card",
        tutorIds: ["tutor-amara"],
      },
    });

    expect(screen.getByRole("button", { name: "Request tutor" })).toBeDisabled();
    expect(screen.getByText(/Pass an onSubmit handler/)).toBeInTheDocument();
  });

  it("submits the completed state", async () => {    const user = userEvent.setup();
    const onSubmit = vi.fn();
    renderForm({
      initialState: {
        description: "need help with integrals",
        scheduledDate: "2026-04-01",
        paymentOptionId: "card",
        tutorIds: ["tutor-amara"],
      },
      onSubmit,
    });

    const submit = screen.getByRole("button", { name: "Request tutor" });
    expect(submit).toBeEnabled();

    await user.click(submit);

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        description: "need help with integrals",
        scheduledDate: "2026-04-01",
        paymentOptionId: "card",
        tutorIds: ["tutor-amara"],
      }),
    );
  });

  it("uses a custom submit label", () => {
    renderForm({ submitLabel: "Send request" });

    expect(screen.getByRole("button", { name: "Send request" })).toBeInTheDocument();
  });
});
/** ################################ /TESTS ############################# */
