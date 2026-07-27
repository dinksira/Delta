export interface QuestionCardProps {
  id: string;
  title: string;
  excerpt: string;
  author: {
    name: string;
    avatarUrl?: string;
    isAnonymous?: boolean;
  };
  tags?: string[];
  upvotes: number;
  answersCount: number;
  createdAt: string;
  isResolved?: boolean;
  isBookmarked?: boolean;
  onClick?: (id: string) => void;
  onBookmarkToggle?: (id: string) => void;
  className?: string;
}
