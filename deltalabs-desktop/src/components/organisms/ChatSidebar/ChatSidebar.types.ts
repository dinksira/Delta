export interface ChatContact {
  id: string;
  name: string;
  avatarUrl?: string;
  isOnline: boolean;
  lastSeen?: string;
  unreadCount?: number;
}

export interface ChatSidebarProps {
  contacts: ChatContact[];
  activeContactId?: string;
  onContactClick: (contactId: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  currentUserStatus: boolean;
  onStatusToggle: (status: boolean) => void;
  className?: string;
}
