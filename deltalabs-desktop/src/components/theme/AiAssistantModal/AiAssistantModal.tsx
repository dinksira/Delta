"use client";

/**
 * AiAssistantModal
 * Centered AI assistant chat modal with robot avatar, text input, and voice recording.
 * Built as an Organism-level component in the Delta Labs design system.
 *
 * @example
 * ```tsx
 * <AiAssistantModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
 * ```
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';

import { DialogOverlay } from '@/components/theme/Dialog';
import { cx } from '@/components/theme/utils';
import Image from 'next/image';

import type { AiAssistantModalProps, ChatMessage } from './AiAssistantModal.types';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

/** Minimal Web Speech API surface — avoids reliance on lib.dom.webSpeech. */
interface BrowserSpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: BrowserSpeechEvent) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

interface BrowserSpeechEvent {
  readonly results: { readonly [index: number]: { readonly [index: number]: { readonly transcript: string } } };
}

// ============================================================================
// CONSTANTS
// ============================================================================

const GREETING_TEXT = 'Hi! How Can I Help You?';

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/** Generate a unique message identifier without external dependencies. */
function generateId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

// ============================================================================
// SUBCOMPONENTS
// ============================================================================

/** Microphone SVG icon with optional active fill state. */
function MicrophoneIcon({ className = '', active = false }: Readonly<{ className?: string; active?: boolean }>) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path
        d="M12 2a3.5 3.5 0 0 0-3.5 3.5v5a3.5 3.5 0 0 0 7 0v-5A3.5 3.5 0 0 0 12 2Z"
        fill={active ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M19 10.5a7 7 0 0 1-14 0" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 17.5v4m-3 0h6" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Right-arrow send icon for the text input. */
function SendIcon({ className = '' }: Readonly<{ className?: string }>) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path d="M5 12h14m0 0-6-6m6 6-6 6" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ============================================================================
// COMPONENT
// ============================================================================

export const AiAssistantModal: React.FC<AiAssistantModalProps> = ({
  isOpen = false,
  onClose,
  className = '',
}) => {
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  /* Reset state on open/close and auto-focus the input field */
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 120);
    } else {
      setMessages([]);
      setInputValue('');
      setIsRecording(false);
    }
  }, [isOpen]);

  /* Auto-scroll to newest message */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  /** Send the current input as a user message and simulate an assistant reply. */
  const handleSendMessage = useCallback((): void => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;

    const userMsg: ChatMessage = { id: generateId(), role: 'user', content: trimmed, timestamp: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');

    /* Simulated assistant reply — replace with real API call later */
    setTimeout(() => {
      const reply: ChatMessage = {
        id: generateId(),
        role: 'assistant',
        content: 'Thanks for your message! AI integration coming soon.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, reply]);
    }, 800);
  }, [inputValue]);

  /** Toggle browser SpeechRecognition for voice-to-text input. */
  const handleToggleRecording = useCallback((): void => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      return;
    }

    const SR =
      (window as unknown as Record<string, unknown>).SpeechRecognition ??
      (window as unknown as Record<string, unknown>).webkitSpeechRecognition;

    if (!SR) return; /* Browser does not support speech recognition */

    const recognition = new (SR as new () => BrowserSpeechRecognition)();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onresult = (event: BrowserSpeechEvent): void => {
      const transcript = event.results[0]?.[0]?.transcript ?? '';
      if (transcript) setInputValue((prev) => (prev ? `${prev} ${transcript}` : transcript));
      setIsRecording(false);
    };
    recognition.onerror = (): void => setIsRecording(false);
    recognition.onend = (): void => setIsRecording(false);

    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
  }, [isRecording]);

  /** Submit on Enter key press. */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setInputValue(e.target.value);
  };

  if (!isOpen) return null;

  const showGreeting = messages.length === 0;

  return (
    <DialogOverlay aria-label="AI Assistant" onClose={onClose} className={cx('flex items-center justify-center', className)}>
      <div
        className="relative flex w-full max-w-sm flex-col overflow-hidden rounded-2xl border border-border-default bg-surface-default shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Close button ─────────────────────────────────────────────── */}
        <button
          type="button"
          className="absolute right-3 top-3 z-10 inline-flex size-8 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40"
          aria-label="Close AI assistant"
          onClick={onClose}
        >
          <span className="text-lg leading-none" aria-hidden>×</span>
        </button>

        {/* ── Body: greeting or conversation ────────────────────────────── */}
        {showGreeting ? (
          <div className="flex flex-col items-center px-6 pb-4 pt-10">
            <div className="mb-4 size-40">
              <Image src="/Ai Bot.svg" alt="AI Assistant" width={160} height={160} className="size-full object-contain" draggable={false} />
            </div>
            <h2 className="mb-3 text-center text-lg font-semibold text-text-primary">{GREETING_TEXT}</h2>
            <button
              type="button"
              className={cx(
                'inline-flex size-12 items-center justify-center rounded-full transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40',
                isRecording ? 'bg-error-500/10 text-error-500 animate-pulse' : 'text-text-secondary hover:bg-surface-muted hover:text-primary-600',
              )}
              aria-label={isRecording ? 'Stop recording' : 'Start voice input'}
              onClick={handleToggleRecording}
            >
              <MicrophoneIcon className="size-7" active={isRecording} />
            </button>
          </div>
        ) : (
          <div className="flex max-h-80 flex-col gap-3 overflow-y-auto px-4 pb-4 pt-12">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cx(
                  'max-w-[85%] rounded-xl px-3 py-2 text-sm',
                  msg.role === 'user' ? 'ml-auto bg-primary-600 text-white' : 'mr-auto bg-surface-muted text-text-primary',
                )}
              >
                {msg.content}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}

        {/* ── Input bar ─────────────────────────────────────────────────── */}
        <div className="flex items-center gap-2 border-t border-border-default px-4 py-3">
          {!showGreeting ? (
            <button
              type="button"
              className={cx(
                'inline-flex size-9 shrink-0 items-center justify-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40',
                isRecording ? 'bg-error-500/10 text-error-500 animate-pulse' : 'text-text-secondary hover:bg-surface-muted',
              )}
              aria-label={isRecording ? 'Stop recording' : 'Start voice input'}
              onClick={handleToggleRecording}
            >
              <MicrophoneIcon className="size-5" active={isRecording} />
            </button>
          ) : null}

          <div className="relative flex flex-1 items-center">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Enter Your Text here"
              className="h-10 w-full rounded-lg border border-border-default bg-surface-default px-3 pr-10 text-sm text-text-primary placeholder:text-text-disabled focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500/40"
            />
            <button
              type="button"
              className="absolute right-1 inline-flex size-8 items-center justify-center rounded-md text-text-secondary transition-colors hover:text-primary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40 disabled:opacity-40"
              aria-label="Send message"
              onClick={handleSendMessage}
              disabled={!inputValue.trim()}
            >
              <SendIcon className="size-5" />
            </button>
          </div>
        </div>
      </div>
    </DialogOverlay>
  );
};

// ============================================================================
// EXPORTS
// ============================================================================

export default AiAssistantModal;
