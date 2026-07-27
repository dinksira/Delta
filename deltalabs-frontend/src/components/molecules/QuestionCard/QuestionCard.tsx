/**
 * QuestionCard
 * Atomic Level: Molecule
 * 
 * Displays a summary of a Q&A question in the list.
 */

import React from 'react';
import type { QuestionCardProps } from './QuestionCard.types';
import { Card } from '@/components/theme';
import { Badge } from '@/components/atoms/Badge';

export const QuestionCard: React.FC<QuestionCardProps> = ({
  id,
  title,
  excerpt,
  author,
  tags = [],
  upvotes,
  answersCount,
  createdAt,
  isResolved = false,
  isBookmarked = false,
  onClick,
  onBookmarkToggle,
  className = '',
}) => {
  return (
    <Card 
      className={`group cursor-pointer transition-all duration-200 hover:border-primary-300 hover:shadow-md ${className}`}
      onClick={() => onClick?.(id)}
    >
      <div className="p-4 flex gap-4">
        {/* Left Stats Column */}
        <div className="flex flex-col items-end gap-2 text-sm w-16 flex-shrink-0 pt-1">
          <div className="text-text-primary font-medium">{upvotes} <span className="text-xs text-text-secondary font-normal">votes</span></div>
          <div className={`${answersCount > 0 ? (isResolved ? 'text-success-500' : 'text-primary-600') : 'text-text-secondary'}`}>
            {answersCount} <span className="text-xs font-normal">answers</span>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start mb-1">
            <h3 className="text-lg font-semibold text-text-primary line-clamp-2 pr-4">{title}</h3>
            <button 
              className="text-text-secondary hover:text-primary-500 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                onBookmarkToggle?.(id);
              }}
              aria-label={isBookmarked ? "Remove bookmark" : "Add bookmark"}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill={isBookmarked ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
            </button>
          </div>
          
          <p className="text-sm text-text-secondary line-clamp-2 mb-3">{excerpt}</p>
          
          <div className="flex justify-between items-center mt-auto">
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <Badge key={tag} variant="default" size="sm">{tag}</Badge>
              ))}
            </div>
            
            <div className="flex items-center gap-2 text-xs text-text-secondary">
              {!author.isAnonymous && author.avatarUrl ? (
                <img src={author.avatarUrl} alt={author.name} className="h-5 w-5 rounded-full object-cover" />
              ) : (
                <div className="h-5 w-5 rounded-full bg-surface-muted flex items-center justify-center text-[10px]">
                  {author.isAnonymous ? 'A' : author.name.charAt(0)}
                </div>
              )}
              <span className="font-medium text-text-primary">{author.isAnonymous ? 'Anonymous' : author.name}</span>
              <span>asked {createdAt}</span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};

QuestionCard.displayName = 'QuestionCard';
