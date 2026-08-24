/**
 * SplitChatLayout
 * Atomic Level: Template
 * 
 * Layout for the community view with a chat area on the left and a contacts sidebar on the right.
 */

import React from 'react';

export interface SplitChatLayoutProps {
  chatArea: React.ReactNode;
  contactSidebar: React.ReactNode;
}

export const SplitChatLayout: React.FC<SplitChatLayoutProps> = ({
  chatArea,
  contactSidebar,
}) => {
  return (
    <div className="flex h-full w-full overflow-hidden bg-surface-canvas">
      {/* Left Chat Area (Flexible) */}
      <div className="flex-1 min-w-0 flex flex-col h-full relative">
        {chatArea}
      </div>

      {/* Right Contact Sidebar (Fixed width) */}
      <div className="flex-shrink-0 h-full z-10">
        {contactSidebar}
      </div>
    </div>
  );
};

SplitChatLayout.displayName = 'SplitChatLayout';
