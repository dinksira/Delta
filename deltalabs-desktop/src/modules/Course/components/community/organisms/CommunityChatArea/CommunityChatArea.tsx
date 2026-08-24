/**
 * CommunityChatArea
 * Main chat area with message history, message input, and contact header.
 *
 * @example
 * ```tsx
 * <CommunityChatArea
 *   activeContact={selectedContact}
 *   messages={mockMessages}
 *   messageInput={inputValue}
 *   onMessageInputChange={setInputValue}
 *   onSendMessage={handleSend}
 * />
 * ```
 */

import React, { useEffect, useRef } from 'react';
import type { CommunityChatAreaProps } from './CommunityChatArea.types';
import { CommunityMessageItem } from '../../molecules/CommunityMessageItem';
import { Input, Typography } from '@/components/theme';

// ============================================================================
// COMPONENT
// ============================================================================

export const CommunityChatArea: React.FC<CommunityChatAreaProps> = ({
  activeContact,
  messages,
  messageInput,
  onMessageInputChange,
  onSendMessage,
  className = '',
  ...props
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSendMessage();
    }
  };

  return (
    <div className={`flex flex-col h-full bg-surface-canvas ${className}`} {...props}>
      {/* Chat Header */}
      <div className="flex-shrink-0 px-6 py-4 border-b border-border-subtle bg-surface-primary flex items-center justify-between">
        {activeContact ? (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-surface-elevated overflow-hidden">
              {activeContact.avatar ? (
                <img
                  src={activeContact.avatar}
                  alt={activeContact.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-text-secondary font-bold">
                  {activeContact.name.charAt(0)}
                </div>
              )}
            </div>
            <div>
              <Typography className="font-bold text-text-primary">
                {activeContact.name}
              </Typography>
              <Typography className="text-xs text-text-secondary">
                {activeContact.handle}
              </Typography>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary-900 flex items-center justify-center text-white font-bold">
              C
            </div>
            <div>
              <Typography className="font-bold text-text-primary">Community</Typography>
            </div>
          </div>
        )}
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 flex flex-col">
        {messages.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <Typography className="text-text-secondary">
              No messages yet. Start a conversation!
            </Typography>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <CommunityMessageItem
                key={message.id}
                id={message.id}
                content={message.content}
                timestamp={message.timestamp}
                isSender={message.isSender}
                senderName={message.senderName}
                senderAvatar={message.senderAvatar}
              />
            ))}
          </>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="flex-shrink-0 pb-8 px-4 pt-4 border-t border-border-subtle bg-surface-primary">
        <div className="flex items-center gap-3">
          {/* Attachments button */}
          <button className="p-2 text-text-secondary hover:text-text-primary transition-colors">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
            </svg>
          </button>

          {/* Image button */}
          <button className="p-2 text-text-secondary hover:text-text-primary transition-colors">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
          </button>

          {/* Input field */}
          <div className="flex-1">
            <Input
              value={messageInput}
              onChange={(e) => onMessageInputChange(e.target.value)}
              placeholder="Start a message"
              onKeyDown={handleKeyDown}
            />
          </div>

          {/* Send button */}
          <button
            onClick={onSendMessage}
            disabled={!messageInput.trim()}
            className={`p-2 rounded-full transition-colors ${
              messageInput.trim()
                ? 'bg-primary-900 text-white hover:bg-primary-800'
                : 'bg-surface-muted text-text-secondary cursor-not-allowed'
            }`}
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// EXPORTS
// ============================================================================

export default CommunityChatArea;
