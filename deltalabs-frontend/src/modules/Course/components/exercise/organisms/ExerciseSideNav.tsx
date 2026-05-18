/** ################################ IMPORT ############################# */
/** Imports used by this file. */
import React from "react";
import { 
  Home, 
  Users, 
  UserPlus, 
  History, 
  GraduationCap, 
  Bell 
} from "lucide-react";
import { cx } from "@/components/theme/utils";

/** ################################ /IMPORT ############################# */

/** ################################ TYPES ############################# */
export type ExerciseTabId = 'home' | 'community' | 'friends' | 'history' | 'tutor' | 'notification';

export interface ExerciseSideNavProps {
  activeId: ExerciseTabId;
  onItemClick: (id: ExerciseTabId) => void;
}

/** ################################ /TYPES ############################# */

/** ################################ COMPONENT ############################# */
/** 
 * ExerciseSideNav Organism
 * Specialized sidebar for the Exercise and Test module.
 */
export const ExerciseSideNav: React.FC<ExerciseSideNavProps> = ({ activeId, onItemClick }) => {
  const navItems = [
    { id: 'home' as ExerciseTabId, label: 'Home', icon: Home },
    { id: 'community' as ExerciseTabId, label: 'Community', icon: Users },
    { id: 'friends' as ExerciseTabId, label: 'Take with friends', icon: UserPlus, dot: true },
    { id: 'history' as ExerciseTabId, label: 'History', icon: History },
    { id: 'tutor' as ExerciseTabId, label: 'Request Tutor', icon: GraduationCap },
    { id: 'notification' as ExerciseTabId, label: 'Notification', icon: Bell, dot: true },
  ];

  return (
    <nav className="fixed left-2 top-1/2 -translate-y-1/2 w-[52px] flex flex-col items-center gap-2.5 z-50 pointer-events-none">
      {navItems.map((item) => {
        const IconComponent = item.icon;
        const isActive = activeId === item.id;
        return (
          <div
            key={item.id}
            onClick={() => onItemClick(item.id)}
            className={cx(
              "relative group w-11 h-11 rounded-xl cursor-pointer flex items-center justify-center pointer-events-auto",
              "transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)]",
              "hover:scale-105 active:scale-95",
              isActive
                ? "bg-primary-900 shadow-[0_8px_20px_-6px_rgba(23,74,95,0.4)] ring-2 ring-primary-900/10"
                : "bg-white border border-border-primary shadow-sm hover:border-primary-600 hover:shadow-md hover:bg-primary-50"
            )}
          >
            <IconComponent 
              size={20} 
              className={cx(
                "transition-all duration-300",
                isActive ? 'text-white scale-110' : 'text-primary-900 group-hover:scale-110'
              )} 
            />

            {item.dot && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white animate-pulse" />
            )}

            {/* Tooltip */}
            <div className="absolute left-[calc(100%+12px)] top-1/2 -translate-y-1/2 bg-primary-900 text-white text-[11px] font-bold rounded-lg px-3 py-1.5 opacity-0 translate-x-[-8px] group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 pointer-events-none z-50 whitespace-nowrap shadow-xl">
              {item.label}
              {/* Tooltip Arrow */}
              <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-primary-900 rotate-45 -z-10" />
            </div>
          </div>
        );
      })}
    </nav>
  );
};

/** ################################ /COMPONENT ############################# */
