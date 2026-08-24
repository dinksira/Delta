/**
 * ChatSidebar
 * Atomic Level: Organism
 * 
 * Displays the list of community contacts with their online status and search functionality.
 */

"use client";

import React from 'react';
import type { ChatSidebarProps } from './ChatSidebar.types';
import { SearchInput } from '@/components/theme';
import { Switch } from '@/components/atoms/Switch';
import { Badge } from '@/components/atoms/Badge';

export const ChatSidebar: React.FC<ChatSidebarProps> = ({
  contacts,
  activeContactId,
  onContactClick,
  searchQuery,
  onSearchChange,
  currentUserStatus,
  onStatusToggle,
  className = '',
}) => {
  return (
    <div className={`flex flex-col h-full bg-surface-primary border-l border-border-default w-80 ${className}`}>
      {/* Header & Status Toggle */}
      <div className="p-4 border-b border-border-subtle flex items-center justify-between">
        <h2 className="font-semibold text-text-primary text-lg">Community</h2>
        <div className="flex items-center gap-2">
          <span className="text-xs text-text-secondary">{currentUserStatus ? 'Available' : 'Invisible'}</span>
          <Switch 
            checked={currentUserStatus} 
            onChange={onStatusToggle}
            size="sm"
          />
        </div>
      </div>

      {/* Search Bar */}
      <div className="p-4 border-b border-border-subtle">
        <SearchInput 
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search members..."
          fullWidth
        />
      </div>

      {/* Contact List */}
      <div className="flex-1 overflow-y-auto">
        {contacts.length === 0 ? (
          <div className="p-8 text-center text-text-secondary text-sm">
            No members found.
          </div>
        ) : (
          <ul className="py-2">
            {contacts.map((contact) => (
              <li key={contact.id}>
                <button
                  className={`w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-surface-muted transition-colors ${
                    activeContactId === contact.id ? 'bg-primary-50 border-r-2 border-primary-500' : ''
                  }`}
                  onClick={() => onContactClick(contact.id)}
                >
                  {/* Avatar */}
                  <div className="relative">
                    {contact.avatarUrl ? (
                      <img src={contact.avatarUrl} alt={contact.name} className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-surface-elevated flex items-center justify-center text-text-secondary font-medium">
                        {contact.name.charAt(0)}
                      </div>
                    )}
                    
                    {/* Status Indicator */}
                    <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-surface-primary ${
                      contact.isOnline ? 'bg-success-500' : 'bg-surface-muted'
                    }`} />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-0.5">
                      <span className={`font-medium truncate ${
                        activeContactId === contact.id ? 'text-primary-700' : 'text-text-primary'
                      }`}>
                        {contact.name}
                      </span>
                      {contact.lastSeen && !contact.isOnline && (
                        <span className="text-[10px] text-text-muted flex-shrink-0">{contact.lastSeen}</span>
                      )}
                    </div>
                    <div className="text-xs text-text-secondary truncate">
                      {contact.isOnline ? 'Online now' : 'Offline'}
                    </div>
                  </div>

                  {/* Unread Badge */}
                  {!!contact.unreadCount && contact.unreadCount > 0 && (
                    <Badge variant="primary" size="sm" className="rounded-full min-w-[1.25rem] h-5 flex items-center justify-center px-1">
                      {contact.unreadCount}
                    </Badge>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

ChatSidebar.displayName = 'ChatSidebar';
