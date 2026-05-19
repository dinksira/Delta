/** ################################ IMPORT ############################# */
/** Imports used by this file. */
import React from "react";
import { ExerciseSideNav, type ExerciseTabId } from "../organisms/ExerciseSideNav";

/** ################################ /IMPORT ############################# */

/** ################################ TYPES ############################# */
export interface ExerciseLayoutProps {
  children: React.ReactNode;
  activeSideTab: ExerciseTabId;
  onSideTabChange: (id: ExerciseTabId) => void;
}

/** ################################ /TYPES ############################# */

/** ################################ COMPONENT ############################# */
/** 
 * ExerciseLayout Template
 * Layout for the Exercise and Test module.
 */
export const ExerciseLayout: React.FC<ExerciseLayoutProps> = ({ 
  children,
  activeSideTab,
  onSideTabChange
}) => {
  return (
    <div className="flex min-h-screen w-full bg-white">
      <ExerciseSideNav activeId={activeSideTab} onItemClick={onSideTabChange} />
      <main className="flex-1 ml-[68px] min-w-0">
        <div className="max-w-[1200px] mx-auto px-8 pt-2 pb-20">
          {children}
        </div>
      </main>
    </div>
  );
};

/** ################################ /COMPONENT ############################# */
