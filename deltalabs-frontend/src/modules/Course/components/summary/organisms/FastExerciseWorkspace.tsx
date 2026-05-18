/** ################################ COMPONENT ############################# */
/** Main exported component logic for this file. */
/** FastExerciseWorkspace Organism: A prompt-based interface for generating practice exercises. */
import React, { useState } from "react";
import { Typography, Button } from "@/components/theme";
import { cx } from "@/components/theme/utils";

export const FastExerciseWorkspace: React.FC = () => {
  const [prompt, setPrompt] = useState("");

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto pt-8 pb-20">
      {/* Top Action Row */}
      <div className="flex items-center justify-end gap-4">
        <Button className="!bg-[#114B5F] !text-white rounded-lg px-6 h-10 text-[13px] font-bold border-none shadow-sm hover:brightness-110 active:scale-95 transition-all">
          Ask Tutor
        </Button>
        <Button className="!bg-[#114B5F] !text-white rounded-lg px-6 h-10 text-[13px] font-bold border-none shadow-sm hover:brightness-110 active:scale-95 transition-all">
          Generate From Roadmap
        </Button>
      </div>

      {/* Main Prompt Area */}
      <div className="relative">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Enter your prompt here"
          className="w-full h-[200px] p-8 rounded-xl border border-[#E2E8F0] bg-white text-[16px] text-[#111827] placeholder:text-[#64748B]/50 outline-none focus:border-[#114B5F] focus:ring-4 focus:ring-[#114B5F]/5 transition-all resize-none shadow-sm"
        />
      </div>

      {/* Bottom Action Row */}
      <div className="flex justify-end">
        <Button 
          disabled={!prompt.trim()}
          className={cx(
            "rounded-lg px-12 h-12 text-[14px] font-black border-none transition-all",
            prompt.trim() 
              ? "!bg-[#114B5F] !text-white shadow-lg shadow-[#114B5F]/20 hover:brightness-110 active:scale-95" 
              : "!bg-[#64748B] !text-white opacity-60 cursor-not-allowed"
          )}
        >
          Next
        </Button>
      </div>
    </div>
  );
};

export default FastExerciseWorkspace;
/** ################################ /COMPONENT ############################# */
