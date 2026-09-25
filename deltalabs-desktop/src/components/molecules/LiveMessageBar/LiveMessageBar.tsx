/**
 * LiveMessageBar — full-width live chat input: a white text field with a dark
 * slate send button at the far right. Submits on Enter or button click and
 * clears the draft.
 *
 * @example
 * ```tsx
 * <LiveMessageBar onSend={(text) => sendMessage(text)} />
 * ```
 */

import { useState, type FormEvent } from "react";

import { Send } from "lucide-react";

import { Button } from "@/components/theme/Button";
import { Input } from "@/components/theme/Input";
import { cn } from "@/lib/utils";

export interface LiveMessageBarProps {
  onSend: (text: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function LiveMessageBar({
  onSend,
  placeholder = "Type a Message............",
  disabled = false,
  className,
}: Readonly<LiveMessageBarProps>) {
  const [value, setValue] = useState("");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const text = value.trim();
    if (!text || disabled) {
      return;
    }
    onSend(text);
    setValue("");
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        "flex items-center gap-2 rounded-2xl border border-border-default bg-surface-default p-2 shadow-sm",
        className,
      )}
    >
      <Input
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        aria-label="Live message"
        className="min-w-0 flex-1 border-0 bg-transparent shadow-none focus:ring-0"
      />
      <Button
        type="submit"
        variant="primary"
        size="md"
        disabled={disabled || !value.trim()}
        className="shrink-0 px-3.5"
        aria-label="Send message"
      >
        <Send className="size-4" aria-hidden />
        <span className="sr-only">Send</span>
      </Button>
    </form>
  );
}

export default LiveMessageBar;