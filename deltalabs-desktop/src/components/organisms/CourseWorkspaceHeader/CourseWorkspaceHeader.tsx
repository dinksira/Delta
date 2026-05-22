import React from 'react';
import { 
  Flag, 
  History, 
  WifiOff, 
  MessageSquareText, 
  LogOut,
  Pencil,
  LucideIcon 
} from "lucide-react";
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { FAB } from '@/components/atoms/FAB';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ============================================================================
// TYPES
// ============================================================================

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  active?: boolean;
}

export interface CourseWorkspaceHeaderProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

const WorkspaceNavItem: React.FC<{ item: NavItem }> = ({ item }) => (
  <a href={item.href} className="flex items-center gap-3 px-2 py-2">
    <div className={cn(
      "flex items-center justify-center w-10 h-10 rounded-full",
      item.active ? "bg-primary-50 text-primary-600" : "bg-slate-50 text-slate-500"
    )}>
      <item.icon size={20} strokeWidth={2.2} />
    </div>
    <span className={cn(
      "text-[15px] font-semibold",
      item.active ? "text-[#1E293B]" : "text-[#475569]"
    )}>
      {item.label}
    </span>
  </a>
);

// ============================================================================
// COMPONENT (Organism)
// ============================================================================

export const CourseWorkspaceHeader: React.FC<CourseWorkspaceHeaderProps> = ({ 
  isCollapsed,
  onToggle
}) => {
  const navItems: NavItem[] = [
    { label: "Super Course", href: "#", icon: Flag, active: true },
    { label: "Recent Activity", href: "#", icon: History },
    { label: "Offline Courses", href: "#", icon: WifiOff },
    { label: "Message", href: "#", icon: MessageSquareText },
    { label: "Unrolled Courses", href: "#", icon: LogOut },
  ];

  return (
    <div className="relative z-30 w-full">
      {/* Collapsible Header Bar */}
      <header 
        className={cn(
          "w-full bg-white transition-all duration-300 ease-in-out overflow-hidden",
          isCollapsed ? "h-0 opacity-0" : "h-20 opacity-100"
        )}
      >
        <div className="max-w-[1600px] mx-auto px-8 h-20 flex items-center justify-center">
          {/* Centered Navigation */}
          <nav className="flex items-center gap-10">
            {navItems.map((item) => (
              <WorkspaceNavItem key={item.label} item={item} />
            ))}
          </nav>
        </div>
      </header>

      {/* Persistent FAB (Anchored to top-right of the header area) */}
      <div className="absolute top-4 right-8">
        <FAB 
          icon={Pencil} 
          size="md" 
          isStatic={true} 
          onClick={onToggle}
          aria-label={isCollapsed ? "Expand Header" : "Collapse Header"}
        />
      </div>
    </div>
  );
};

export default CourseWorkspaceHeader;
