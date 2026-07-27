export interface Course {
  id: string;
  title: string;
  provider: string;
  thumbnailUrl?: string;
  progress: number;
  status: 'not_started' | 'in_progress' | 'completed';
  tags: string[];
}

export interface Question {
  id: string;
  title: string;
  excerpt: string;
  body?: string;
  author: {
    name: string;
    avatarUrl?: string;
    isAnonymous?: boolean;
  };
  tags: string[];
  upvotes: number;
  answersCount: number;
  createdAt: string;
  isResolved: boolean;
  isBookmarked: boolean;
  isPaid?: boolean;
  bountyAmount?: number;
}

export interface ChatContact {
  id: string;
  name: string;
  avatarUrl?: string;
  isOnline: boolean;
  lastSeen?: string;
  unreadCount?: number;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  content: string;
  timestamp: string;
  isRead: boolean;
}

export interface CourseState {
  enrolledCourses: Course[];
  bookmarkedQuestions: Question[];
  currentUserStatus: boolean; // true = online, false = offline
  isLoading: boolean;
  error: string | null;
}

export interface CourseContextValue extends CourseState {
  fetchEnrolledCourses: () => Promise<void>;
  toggleUserStatus: (status: boolean) => void;
  toggleQuestionBookmark: (questionId: string) => void;
}
