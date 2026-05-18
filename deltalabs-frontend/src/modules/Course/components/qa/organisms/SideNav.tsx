/** ################################ IMPORT ############################# */
/** Imports used by this file. */
import React from "react";
import { 
  User, 
  Bookmark, 
  Bell, 
  GitBranch, 
  CircleDollarSign,
  Wifi
} from "lucide-react";
import { cx } from "@/components/theme/utils";

/** ################################ /IMPORT ############################# */

/** ################################ SUBCOMPONENTS ############################# */
/** Custom mesh globe icon to match Figma design exactly. */
const MeshGlobeIcon = ({ size = 20, className = "" }: { size?: number, className?: string }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="1.5"
    className={className}
  >
    <circle cx="12" cy="12" r="10"/>
    <line x1="2" y1="12" x2="22" y2="12"/>
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
    <line x1="12" y1="2" x2="12" y2="22"/>
  </svg>
);

/** ################################ /SUBCOMPONENTS ############################# */

/** ################################ TYPES ############################# */
export type SideTabId = 'my-questions' | 'bookmark' | 'notification' | 'community' | 'live' | 'network' | 'payment';

export interface SideNavProps {
  activeId: SideTabId;
  onItemClick: (id: SideTabId) => void;
}

/** ################################ /TYPES ############################# */

/** ################################ COMPONENT ############################# */
/** 
 * SideNav Organism
 * Floating navigation system with independent icon boxes.
 */
export const SideNav: React.FC<SideNavProps> = ({ activeId, onItemClick }) => {
  const navItems = [
    { 
      id: 'my-questions' as SideTabId, 
      label: 'My Questions', 
      icon: User,
    },
    { 
      id: 'bookmark' as SideTabId, 
      label: 'Bookmark', 
      icon: Bookmark,
    },
    { 
      id: 'notification' as SideTabId, 
      label: 'Notification', 
      icon: Bell,
      badge: true 
    },
    { 
      id: 'community' as SideTabId, 
      label: 'Community', 
      icon: MeshGlobeIcon,
    },
    { 
      id: 'live' as SideTabId, 
      label: 'Live', 
      icon: Wifi,
      badge: true 
    },
    { 
      id: 'network' as SideTabId, 
      label: 'Network', 
      icon: GitBranch,
    },
    { 
      id: 'payment' as SideTabId, 
      label: 'Payment Management', 
      icon: CircleDollarSign,
    },
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

            {item.badge && (
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
