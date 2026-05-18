"use client";

/** ################################ IMPORT ############################# */
/** Imports used by this file. */
import { Mic, Send, X } from "lucide-react";
import Image from "next/image";

import { DialogOverlay, DialogPanel } from "@/components/theme/Dialog";
import { Typography } from "@/components/theme";

/** ################################ /IMPORT ############################# */
/** ################################ TYPES ############################# */
/** Type definitions used in this file. */
export type AiAssistantModalProps = Readonly<{
  onClose: () => void;
}>;

/** ################################ /TYPES ############################# */
/** ################################ COMPONENT ############################# */
/** Main exported component logic for this file. */
/**
 * AI Assistant Modal component that displays a friendly greeting,
 * a microphone entry point, and a text input for AI interaction.
 */
export function AiAssistantModal({ onClose }: AiAssistantModalProps) {
  return (
    <DialogOverlay 
      aria-label="AI Assistant" 
      onClose={onClose}
      className="flex items-center justify-center p-4"
    >
      <div className="w-full max-w-[24rem] sm:max-w-md md:max-w-[32rem]">
        <DialogPanel 
          className="relative overflow-hidden p-6 text-center shadow-2xl sm:p-10"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <button
            type="button"
            className="absolute right-4 top-4 text-text-secondary transition-colors hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            aria-label="Close"
          >
            <X size={24} strokeWidth={1.5} />
          </button>

          {/* AI Bot Image */}
          <div className="relative mx-auto mb-6 h-40 w-40 sm:h-52 sm:w-52">
            <Image
              src="/Ai%20Bot.svg"
              alt="AI Assistant Bot"
              fill
              className="object-contain"
              priority
            />
          </div>

          {/* Greeting */}
          <Typography
            as="h2"
            variant="h2"
            className="mb-8 text-[24px] font-medium tracking-tight text-primary-600 sm:text-[32px]"
          >
            Hi! How Can I Help You?
          </Typography>

          {/* Microphone Icon */}
          <div className="mb-10 flex justify-center">
            <button
              type="button"
              className="flex size-14 items-center justify-center rounded-full text-primary-600 transition-transform hover:scale-110 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40 sm:size-20"
              aria-label="Voice input"
            >
              <Mic size={48} strokeWidth={1.5} className="sm:size-14" />
            </button>
          </div>

          {/* Input Field */}
          <div className="relative">
            <input
              type="text"
              placeholder="Enter Your Text here"
              className="w-full rounded-2xl border border-primary-600/30 px-6 py-4 pr-12 text-lg text-text-primary placeholder:text-text-secondary/50 transition-colors focus:border-primary-600 focus:outline-none focus:ring-1 focus:ring-primary-600"
            />
            <button
              type="button"
              className="absolute right-4 top-1/2 -translate-y-1/2 text-primary-600/60 transition-colors hover:text-primary-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/40"
              aria-label="Send message"
            >
              <Send size={24} />
            </button>
          </div>
        </DialogPanel>
      </div>
    </DialogOverlay>
  );
}

/** ################################ /COMPONENT ############################# */
/** ################################ EXPORTS ############################# */
export default AiAssistantModal;
