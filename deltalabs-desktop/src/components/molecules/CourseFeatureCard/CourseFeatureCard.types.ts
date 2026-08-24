import { HTMLAttributes, ReactNode } from 'react';

export interface CourseFeatureCardProps extends HTMLAttributes<HTMLDivElement> {
  /** Icon element */
  icon: ReactNode;
  
  /** Custom background classes for the icon container, if needed */
  iconContainerClassName?: string;
  
  /** Title text */
  title: string;
  
  /** Description text */
  description: string;
  
  /** Click handler */
  onClick?: () => void;
}
