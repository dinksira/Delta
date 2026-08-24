export interface CourseCardProps {
  id: string;
  title: string;
  provider: string;
  thumbnailUrl?: string;
  progress?: number;
  status?: 'not_started' | 'in_progress' | 'completed';
  tags?: string[];
  onClick?: (id: string) => void;
  className?: string;
}
