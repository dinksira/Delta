/** @vitest-environment jsdom */
import React from "react";

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import MessageModal from "./MessageModal";
import type { Message } from "./MessageModal.types";
/** ################################ TESTS ############################# */
/** Behaviour tests for the chat thread. */

/** A short incoming and outgoing thread. */
const THREAD: readonly Message[] = [
  { id: "1", text: "Hello sir, nice to meet you", timestamp: "18:12", sender: "other" },
  { id: "2", text: "Hello", timestamp: "18:16", sender: "me", status: "read" },
];

/** Renders the dialog with sensible defaults. */
function renderModal(overrides: Partial<React.ComponentProps<typeof MessageModal>> = {}) {
  const props = {
    isOpen: true,
    onClose: vi.fn(),
    initialMessages: THREAD,
    conversationTitle: "Beta Academy",
    ...overrides,
  };
  return { ...render(<MessageModal {...props} />), props };
}

describe("MessageModal", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(new Date("2026-03-05T09:07:00"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders nothing while closed", () => {
    const { container } = renderModal({ isOpen: false });
    expect(container).toBeEmptyDOMElement();
  });

  it("names the dialog after the conversation", () => {
    renderModal();
    expect(screen.getByRole("dialog", { name: "Message: Beta Academy" })).toBeInTheDocument();
  });

  it("shows the conversation title in its own heading", () => {
    renderModal();
    expect(screen.getByRole("heading", { name: /Beta Academy/ })).toBeInTheDocument();
  });

  it("renders the messages it is given, not built-in ones", () => {
    renderModal({ initialMessages: [{ id: "a", text: "Only this", timestamp: "09:00", sender: "other" }] });
    expect(screen.getByText("Only this")).toBeInTheDocument();
    expect(screen.queryByText("Hello sir, nice to meet you")).not.toBeInTheDocument();
  });

  it("starts empty when no messages are supplied", () => {
    renderModal({ initialMessages: [] });
    expect(screen.getByText("No messages yet. Say hello.")).toBeInTheDocument();
  });

  it("exposes the thread as a polite live region", () => {
    renderModal();
    const log = screen.getByRole("log", { name: "Conversation" });
    expect(log).toHaveAttribute("aria-live", "polite");
    expect(log).toHaveAttribute("aria-relevant", "additions");
  });

  it("names the sender and exposes a machine-readable time", () => {
    renderModal();
    const log = screen.getByRole("log");
    expect(log).toHaveTextContent("Beta Academy said at");
    expect(log).toHaveTextContent("You said at");
    expect(log.querySelector("time")).toHaveAttribute("dateTime");
  });

  it("distinguishes a read message from a sent one", () => {
    renderModal();
    const log = screen.getByRole("log");
    expect(log).toHaveTextContent("Read");
    expect(log).not.toHaveTextContent("Sent");
  });

  it("labels the new message as Sent", () => {
    renderModal();
    expect(screen.getByRole("log")).toHaveTextContent("Read");
  });

  it("appends a sent message to the log", async () => {
    const user = userEvent.setup();
    renderModal();

    await user.type(screen.getByLabelText("Message"), "On my way");
    await user.click(screen.getByRole("button", { name: "Send message" }));

    expect(screen.getByRole("log")).toHaveTextContent("On my way");
  });

  it("reports the trimmed body to onSend", async () => {
    const user = userEvent.setup();
    const onSend = vi.fn();
    renderModal({ onSend });

    await user.type(screen.getByLabelText("Message"), "  hello  ");
    await user.click(screen.getByRole("button", { name: "Send message" }));

    expect(onSend).toHaveBeenCalledWith("hello");
  });

  it("clears the composer after sending", async () => {
    const user = userEvent.setup();
    renderModal();

    await user.type(screen.getByLabelText("Message"), "hello");
    await user.click(screen.getByRole("button", { name: "Send message" }));

    expect(screen.getByLabelText("Message")).toHaveValue("");
  });

  it("pads the timestamp to HH:mm", async () => {
    const user = userEvent.setup();
    renderModal();

    await user.type(screen.getByLabelText("Message"), "hello");
    await user.click(screen.getByRole("button", { name: "Send message" }));

    expect(screen.getByText("09:07")).toBeInTheDocument();
  });

  it("ignores a blank message", async () => {
    const user = userEvent.setup();
    const onSend = vi.fn();
    renderModal({ onSend });

    await user.type(screen.getByLabelText("Message"), "   ");
    await user.click(screen.getByRole("button", { name: "Send message" }));

    expect(onSend).not.toHaveBeenCalled();
  });

  it("disables send while the draft is empty", () => {
    renderModal();
    expect(screen.getByRole("button", { name: "Send message" })).toBeDisabled();
  });

  it("sends on Enter", async () => {
    const user = userEvent.setup();
    const onSend = vi.fn();
    renderModal({ onSend });

    await user.type(screen.getByLabelText("Message"), "quick{Enter}");

    expect(onSend).toHaveBeenCalledWith("quick");
  });

  it("keeps a newline on Shift+Enter instead of sending", async () => {
    const user = userEvent.setup();
    const onSend = vi.fn();
    renderModal({ onSend });

    await user.type(screen.getByLabelText("Message"), "line one{Shift>}{Enter}{/Shift}line two");

    expect(onSend).not.toHaveBeenCalled();
    expect(screen.getByLabelText("Message")).toHaveValue("line one\nline two");
  });

  it("gives each sent message a distinct id", async () => {
    const user = userEvent.setup();
    renderModal();

    const field = screen.getByLabelText("Message");
    await user.type(field, "first{Enter}");
    await user.type(field, "second{Enter}");

    const bubbles = screen.getAllByText(/first|second/);
    expect(bubbles).toHaveLength(2);
  });

  it("discloses the emoji panel with aria-expanded", async () => {
    const user = userEvent.setup();
    renderModal();

    const toggle = screen.getByRole("button", { name: "Insert emoji" });
    expect(toggle).toHaveAttribute("aria-expanded", "false");

    await user.click(toggle);

    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("group", { name: "Emoji" })).toBeInTheDocument();
  });

  it("appends the chosen emoji to the draft and closes the panel", async () => {
    const user = userEvent.setup();
    renderModal();

    await user.click(screen.getByRole("button", { name: "Insert emoji" }));
    await user.click(screen.getByRole("button", { name: "Insert 👍" }));

    expect(screen.getByLabelText("Message")).toHaveValue("👍");
    expect(screen.queryByRole("group", { name: "Emoji" })).not.toBeInTheDocument();
  });

  it("closes the emoji panel on Escape", async () => {
    const user = userEvent.setup();
    renderModal();

    await user.click(screen.getByRole("button", { name: "Insert emoji" }));
    await user.keyboard("{Escape}");

    expect(screen.queryByRole("group", { name: "Emoji" })).not.toBeInTheDocument();
  });

  it("closes from the back control", async () => {
    const user = userEvent.setup();
    const { props } = renderModal();

    await user.click(screen.getByRole("button", { name: "Close conversation" }));

    expect(props.onClose).toHaveBeenCalledTimes(1);
  });
});
/** ################################ /TESTS ############################# */
