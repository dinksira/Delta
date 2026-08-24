/**
 * CommunitySidebar
 * Sidebar with Community/Group/Settings tabs, contacts list, and groups list.
 *
 * @example
 * ```tsx
 * <CommunitySidebar
 *   activeTab="community"
 *   contacts={mockContacts}
 *   groups={mockGroups}
 *   onTabChange={setActiveTab}
 *   onContactClick={handleContactClick}
 *   onGroupClick={handleGroupClick}
 * />
 * ```
 */

import React from 'react';
import type { CommunitySidebarProps } from './CommunitySidebar.types';
import { CommunityTabNav } from '../../molecules/CommunityTabNav';
import { CommunityContactItem } from '../../molecules/CommunityContactItem';
import { Typography, Select } from '@/components/theme';

// ============================================================================
// COMPONENT
// ============================================================================

export const CommunitySidebar: React.FC<CommunitySidebarProps> = ({
  activeTab,
  activeContactId,
  contacts,
  groups,
  onTabChange,
  onContactClick,
  onGroupClick,
  className = '',
  ...props
}) => {
  return (
    <div className={`flex flex-col h-full bg-surface-primary border-l border-border-default w-80 ${className}`} {...props}>
      {/* Header */}
      <div className="p-4 border-b border-border-subtle">
        <Typography className="text-lg font-bold text-text-primary">Community</Typography>
      </div>

      {/* Tab Nav */}
      <div className="px-4 py-3 border-b border-border-subtle">
        <CommunityTabNav activeTab={activeTab} onTabChange={onTabChange} />
      </div>

      {/* Content based on active tab */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'community' && (
          <div className="p-4">
            <Typography className="text-sm font-bold text-text-primary mb-3">2 online</Typography>
            <div className="space-y-1">
              {contacts.map((contact) => (
                <CommunityContactItem
                  key={contact.id}
                  id={contact.id}
                  name={contact.name}
                  handle={contact.handle}
                  avatar={contact.avatar}
                  statusText={contact.statusText}
                  onlineStatus={contact.onlineStatus}
                  isActive={activeContactId === contact.id}
                  onClick={() => onContactClick(contact.id)}
                />
              ))}
            </div>
          </div>
        )}

        {activeTab === 'group' && (
          <div className="p-4">
            <div className="flex justify-center mb-4">
              <button className="px-4 py-2 border-2 border-dashed border-border-subtle rounded-lg text-text-secondary hover:border-primary-500 hover:text-primary-500 transition-colors">
                <Typography className="text-sm font-medium">Create Group</Typography>
              </button>
            </div>
            <div className="space-y-3">
              {groups.map((group) => (
                <button
                  key={group.id}
                  onClick={() => onGroupClick(group.id)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-surface-muted/30 transition-all text-left"
                >
                  <div className="shrink-0 w-12 h-12 rounded-lg bg-surface-elevated overflow-hidden">
                    {group.avatar ? (
                      <img
                        src={group.avatar}
                        alt={group.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-primary-900 flex items-center justify-center text-white font-bold">
                        {group.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <Typography className="text-sm font-bold text-text-primary truncate">
                      {group.name}
                    </Typography>
                    <Typography className="text-xs text-text-secondary truncate">
                      {group.description}
                    </Typography>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'setting' && (
          <div className="p-4 space-y-4">
            {/* Setting Item 1 */}
            <div className="flex items-center justify-between py-3 border-b border-border-subtle">
              <Typography className="text-sm text-text-primary">Receive notifications</Typography>
              <div className="w-32">
                <Select defaultValue="allowed">
                  <option value="allowed">Allowed</option>
                  <option value="disabled">Disabled</option>
                </Select>
              </div>
            </div>

            {/* Setting Item 2 */}
            <div className="flex items-center justify-between py-3 border-b border-border-subtle">
              <Typography className="text-sm text-text-primary">Receive notifications</Typography>
              <div className="w-32">
                <Select defaultValue="allowed">
                  <option value="allowed">Allowed</option>
                  <option value="disabled">Disabled</option>
                </Select>
              </div>
            </div>

            {/* Setting Item 3 */}
            <div className="flex items-center justify-between py-3">
              <Typography className="text-sm text-text-primary">Receive notifications</Typography>
              <div className="w-32">
                <Select defaultValue="allowed">
                  <option value="allowed">Allowed</option>
                  <option value="disabled">Disabled</option>
                </Select>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// EXPORTS
// ============================================================================

export default CommunitySidebar;
