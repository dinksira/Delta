/** ################################ IMPORT ############################# */
/** Imports used by this file. */
import React from "react";
import { 
  Bold, 
  Italic, 
  List, 
  ListOrdered, 
  Link2, 
  Image as ImageIcon, 
  Code, 
  Maximize2 
} from "lucide-react";
import { Typography, Button } from "@/components/theme";

/** ################################ /IMPORT ############################# */

/** ################################ COMPONENT ############################# */
/** 
 * AnswerEditor Molecule
 * A high-fidelity rich text editor mock for submitting answers.
 */
export const AnswerEditor: React.FC = () => {
  return (
    <div className="flex flex-col w-full bg-white rounded-2xl border border-border-subtle overflow-hidden shadow-sm">
      {/* Editor Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border-subtle bg-surface-secondary/50">
        <div className="flex items-center gap-1">
          <ToolbarButton icon={<Bold size={18} />} />
          <ToolbarButton icon={<Italic size={18} />} />
          <div className="w-[1px] h-4 bg-border-subtle mx-1" />
          <ToolbarButton icon={<List size={18} />} />
          <ToolbarButton icon={<ListOrdered size={18} />} />
          <div className="w-[1px] h-4 bg-border-subtle mx-1" />
          <ToolbarButton icon={<Link2 size={18} />} />
          <ToolbarButton icon={<ImageIcon size={18} />} />
          <ToolbarButton icon={<Code size={18} />} />
        </div>
        
        <button className="p-1.5 text-text-tertiary hover:text-text-primary transition-colors">
          <Maximize2 size={16} />
        </button>
      </div>

      {/* Text Area */}
      <div className="relative min-h-[200px] p-6">
        <textarea 
          placeholder="Write your answer here..."
          className="w-full h-full min-h-[150px] resize-none text-[15px] text-text-primary placeholder:text-text-tertiary outline-none bg-transparent"
        />
      </div>

      {/* Footer / Submit */}
      <div className="flex items-center justify-between px-6 py-4 bg-surface-secondary/30 border-t border-border-subtle/50">
        <Typography className="text-[12px] text-text-tertiary">
          Press <span className="font-bold">Ctrl + Enter</span> to post
        </Typography>
        
        <div className="flex items-center gap-3">
          <button className="px-5 py-2 text-sm font-bold text-text-tertiary hover:text-text-primary transition-colors">
            Cancel
          </button>
          <Button className="h-10 px-8 rounded-xl !bg-primary-900 !text-white font-bold text-sm shadow-lg shadow-primary-900/20">
            Post Answer
          </Button>
        </div>
      </div>
    </div>
  );
};

/** Helper Subcomponent */
const ToolbarButton: React.FC<{ icon: React.ReactNode }> = ({ icon }) => (
  <button className="p-2 text-text-secondary hover:bg-white hover:text-primary-600 rounded-lg transition-all active:scale-90">
    {icon}
  </button>
);

/** ################################ /COMPONENT ############################# */
