"use client";

import React, { useState } from 'react';
import { SplitChatLayout } from '@/components/templates/SplitChatLayout';
import { ChatSidebar } from '@/components/organisms/ChatSidebar';
import { ChatMessage } from '@/components/molecules/ChatMessage';
import { useCourse } from '../context/CourseContext';
import { Input, Button } from '@/components/theme';

const MOCK_CONTACTS = [
  { id: '1', name: 'Alice Smith', isOnline: true, unreadCount: 2 },
  { id: '2', name: 'Bob Johnson', isOnline: false, lastSeen: '2h ago' },
  { id: '3', name: 'Charlie Davis', isOnline: true },
];

const MOCK_MESSAGES = [
  { id: 'm1', content: 'Hey everyone, working on the new module!', senderId: '1', timestamp: '10:00 AM' },
  { id: 'm2', content: 'That sounds great! Need any help?', senderId: 'me', timestamp: '10:05 AM' },
  { id: 'm3', content: 'I might need some review on the architecture later today.', senderId: '1', timestamp: '10:15 AM' },
];

export const CommunityView: React.FC = () => {
  const { currentUserStatus, toggleUserStatus } = useCourse();
  const [activeContactId, setActiveContactId] = useState<string>('1');
  const [searchQuery, setSearchQuery] = useState('');
  const [messageInput, setMessageInput] = useState('');

  const handleSendMessage = () => {
    if (!messageInput.trim()) return;
    // In a real app, this would send via WebSockets or API
    setMessageInput('');
  };

  return (
    <SplitChatLayout
      contactSidebar={
        <ChatSidebar
          contacts={MOCK_CONTACTS.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()))}
          activeContactId={activeContactId}
          onContactClick={setActiveContactId}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          currentUserStatus={currentUserStatus}
          onStatusToggle={toggleUserStatus}
        />
      }
      chatArea={
        <div className="flex flex-col h-full bg-surface-canvas">
          {/* Chat Header */}
          <div className="flex-shrink-0 px-6 py-4 border-b border-border-default bg-surface-primary flex items-center justify-between shadow-sm z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center font-bold">
                {MOCK_CONTACTS.find(c => c.id === activeContactId)?.name.charAt(0) || 'C'}
              </div>
              <div>
                <h2 className="font-semibold text-text-primary text-lg">
                  {MOCK_CONTACTS.find(c => c.id === activeContactId)?.name || 'Community Chat'}
                </h2>
                <p className="text-xs text-text-secondary">
                  {MOCK_CONTACTS.find(c => c.id === activeContactId)?.isOnline ? 'Online' : 'Offline'}
                </p>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" aria-label="Search in chat">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </Button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 flex flex-col">
            {MOCK_MESSAGES.map((msg) => (
              <ChatMessage
                key={msg.id}
                id={msg.id}
                text={msg.content}
                timestamp={msg.timestamp}
                isSelf={msg.senderId === 'me'}
                senderName={msg.senderId === 'me' ? 'You' : MOCK_CONTACTS.find(c => c.id === msg.senderId)?.name || 'Guest'}
                senderAvatar=""
              />
            ))}
            <div className="mt-auto" />
          </div>

          {/* Input Area */}
          <div className="flex-shrink-0 p-4 border-t border-border-subtle bg-surface-primary">
            <div className="flex gap-2">
              <Input
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                placeholder="Type a message..."
                className="flex-1"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
              />
              <Button variant="primary" onClick={handleSendMessage} disabled={!messageInput.trim()}>
                Send
              </Button>
            </div>
          </div>
        </div>
      }
    />
  );
};
