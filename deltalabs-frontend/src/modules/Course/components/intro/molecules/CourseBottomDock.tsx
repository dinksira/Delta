/**
 * CourseBottomDock
 * Floating dark teal dock bar at the bottom of the course detail view.
 * Contains 9 navigational icon buttons mapped to premium SVG assets.
 *
 * @example
 * ```tsx
 * <CourseBottomDock
 *   activeTab="intro"
 *   onTabChange={(tab) => console.log(tab)}
 * />
 * ```
 */

/** ################################ IMPORT ############################# */
/** React core and local atom dependencies. */
import React from "react";
import { DockNavIcon } from "../atoms/DockNavIcon";
/** ################################ /IMPORT ############################# */

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

/** ################################ TYPES ############################# */
/** Available dock tab identifiers for course sub-sections */
export type CourseDockTabId =
  | "intro"
  | "qa"
  | "exercise"
  | "summary"
  | "score"
  | "supplement"
  | "resources"
  | "roadmap"
  | "community";

/** Props definition for bottom navigation dock. */
export interface CourseBottomDockProps {
  /** Currently active dock tab */
  activeTab: CourseDockTabId;
  /** Handler when a dock tab is selected */
  onTabChange: (tab: CourseDockTabId) => void;
}

interface DockItemDefinition {
  id: CourseDockTabId;
  label: string;
  icon: string;
}
/** ################################ /TYPES ############################# */

// ============================================================================
// CONSTANTS
// ============================================================================

/** ################################ CONSTANTS ############################# */
/** List of bottom dock items mapped to their target SVG paths. */
const DOCK_ITEMS: readonly DockItemDefinition[] = [
  { id: "intro", label: "Course", icon: "/Course Intro.svg" },
  { id: "qa", label: "Q&A", icon: "/Q&a.svg" },
  { id: "exercise", label: "Exercise", icon: "/Exercise & Test.svg" },
  { id: "summary", label: "Summary", icon: "/Fast Summary.svg" },
  { id: "score", label: "Score", icon: "/Score.svg" },
  { id: "supplement", label: "Supp.", icon: "/Supplemenr.svg" },
  { id: "resources", label: "Resources", icon: "/Resources.svg" },
  { id: "roadmap", label: "Roadmap", icon: "/Roadmap.svg" },
  { id: "community", label: "Community", icon: "/Community.svg" },
] as const;
/** ################################ /CONSTANTS ############################# */

// ============================================================================
// COMPONENT
// ============================================================================

/** ################################ COMPONENT ############################# */
/** Floating dock navigation container rendering the list of DockNavIcons. */
export const CourseBottomDock: React.FC<Readonly<CourseBottomDockProps>> = ({
  activeTab,
  onTabChange,
}) => {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 w-full z-50 flex items-center justify-center gap-6 px-6 py-3 bg-primary-800 rounded-t-2xl rounded-b-none shadow-[0_-8px_30px_rgba(0,0,0,0.3)] border-t border-primary-700/50"
      role="tablist"
      aria-label="Course sections dock"
    >
      {DOCK_ITEMS.map((item) => (
        <DockNavIcon
          key={item.id}
          icon={item.icon}
          label={item.label}
          isActive={activeTab === item.id}
          onClick={() => onTabChange(item.id)}
        />
      ))}
    </nav>
  );
};

CourseBottomDock.displayName = "CourseBottomDock";
/** ################################ /COMPONENT ############################# */

// ============================================================================
// EXPORTS
// ============================================================================

export default CourseBottomDock;
