export interface EnrolledCourseCardProps {
  /** Unique identifier for the course */
  id: string;
  
  /** URL for the course thumbnail image */
  thumbnailUrl?: string;
  
  /** Title of the course */
  title: string;
  
  /** Name of the provider or organization */
  providerName: string;
  
  /** URL for the provider logo image */
  providerLogoUrl?: string;
  
  /** Rating text (e.g. "4.8 Reviews") */
  ratingText?: string;
  
  /** Number of lessons */
  lessonsCount?: number;
  
  /** Optional custom CSS classes */
  className?: string;
  
  /** Callback when "Go to course" is clicked */
  onGoToCourse?: (id: string) => void;
  
  /** Callback when "Unroll" is clicked */
  onUnroll?: (id: string) => void;
  
  /** Callback when "Share" is clicked */
  onShare?: (id: string) => void;
}
