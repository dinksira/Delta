/**
 * CourseCard
 * Atomic Level: Molecule
 * 
 * Displays course information in a card format, suitable for dashboards and listings.
 */

import React from 'react';
import type { CourseCardProps } from './CourseCard.types';
import { Card } from '@/components/theme';
import { Badge } from '@/components/atoms/Badge';
import { ProgressBar } from '@/components/atoms/ProgressBar';

export const CourseCard: React.FC<CourseCardProps> = ({
  id,
  title,
  provider,
  thumbnailUrl,
  progress = 0,
  status = 'not_started',
  tags = [],
  onClick,
  className = '',
}) => {
  return (
    <Card 
      className={`group cursor-pointer overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${className}`}
      onClick={() => onClick?.(id)}
    >
      <div className="relative h-40 w-full overflow-hidden bg-surface-muted">
        {thumbnailUrl ? (
          <img 
            src={thumbnailUrl} 
            alt={title} 
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-primary-50 text-primary-300">
            {/* Placeholder Icon */}
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
        )}
        {status === 'completed' && (
          <div className="absolute top-2 right-2">
            <Badge variant="success">Completed</Badge>
          </div>
        )}
      </div>

      <div className="p-4">
        <p className="text-xs font-medium text-text-secondary mb-1 uppercase tracking-wider">{provider}</p>
        <h3 className="text-lg font-semibold text-text-primary mb-2 line-clamp-2">{title}</h3>
        
        <div className="mb-4 flex flex-wrap gap-2">
          {tags.map((tag) => (
            <Badge key={tag} variant="default" size="sm">{tag}</Badge>
          ))}
        </div>

        {status !== 'not_started' && (
          <div className="mt-auto pt-2 border-t border-border-subtle">
            <div className="flex justify-between items-center mb-1 text-xs text-text-secondary">
              <span>{progress}% Complete</span>
            </div>
            <ProgressBar progress={progress} />
          </div>
        )}
      </div>
    </Card>
  );
};

CourseCard.displayName = 'CourseCard';
