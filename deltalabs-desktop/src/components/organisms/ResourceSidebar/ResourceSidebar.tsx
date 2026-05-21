import React from 'react';
import { Home, ShoppingCart, ShoppingBag, UserPlus, Bell, PieChart } from 'lucide-react';
import { cx } from '@/components/theme/utils';

export type ResourceSidebarTabId = 'home' | 'cart' | 'order' | 'rent' | 'notification' | 'resources';

export interface ResourceSidebarProps {
  activeTab: ResourceSidebarTabId;
  onTabChange: (tabId: ResourceSidebarTabId) => void;
}

interface SidebarItem {
  id: ResourceSidebarTabId;
  icon: React.ElementType;
  label: string;
}

const SIDEBAR_ITEMS: SidebarItem[] = [
  { id: 'home', icon: Home, label: 'Home' },
  { id: 'cart', icon: ShoppingCart, label: 'Cart' },
  { id: 'order', icon: ShoppingBag, label: 'Orders' },
  { id: 'rent', icon: UserPlus, label: 'Rent' },
  { id: 'notification', icon: Bell, label: 'Notification' },
  { id: 'resources', icon: PieChart, label: 'Resources' },
];

export const ResourceSidebar: React.FC<ResourceSidebarProps> = ({
  activeTab,
  onTabChange,
}) => {
  return (
    <nav className="fixed left-2 top-1/2 -translate-y-1/2 w-[52px] flex flex-col items-center gap-2.5 z-50 pointer-events-none">
      {SIDEBAR_ITEMS.map((item) => {
        const isActive = activeTab === item.id;
        const Icon = item.icon;

        return (
          <div key={item.id} className="relative group pointer-events-auto">
            <button
              onClick={() => onTabChange(item.id)}
              className={cx(
                "flex items-center justify-center w-11 h-11 rounded-xl transition-all duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] relative",
                "hover:scale-105 active:scale-95",
                isActive 
                  ? "bg-primary-900 text-white shadow-[0_8px_20px_-6px_rgba(23,74,95,0.4)] ring-2 ring-primary-900/10" 
                  : "bg-white border border-border-primary text-primary-900 hover:border-primary-600 hover:shadow-md hover:bg-primary-50"
              )}
            >
              <Icon 
                size={20} 
                className={cx(
                  "transition-all duration-300",
                  isActive ? "text-white scale-110" : "text-primary-900/70 group-hover:text-primary-900 group-hover:scale-110"
                )} 
              />
            </button>

            {/* Tooltip */}
            <div className="absolute left-[calc(100%+12px)] top-1/2 -translate-y-1/2 bg-primary-900 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg opacity-0 translate-x-[-8px] group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 pointer-events-none whitespace-nowrap z-50 shadow-xl">
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

export default ResourceSidebar;
