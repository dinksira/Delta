/**
 * CourseFeatureCard
 * Atomic Level: Molecule
 *
 * Feature card used in the Course Home dashboard.
 * Matches the design: standalone line-art icon above bold title + description.
 * No card background, border, or shadow — just clean content with whitespace.
 */

import React from 'react';
import type { CourseFeatureCardProps } from './CourseFeatureCard.types';

// ============================================================================
// COMPONENT
// ============================================================================

export const CourseFeatureCard: React.FC<CourseFeatureCardProps> = ({
  icon,
  iconContainerClassName = '',
  title,
  description,
  onClick,
  className = '',
  ...props
}) => {
  return (
    <div
      className={`flex flex-col gap-4 p-4 cursor-pointer rounded-xl border border-transparent hover:border-border-default transition-colors duration-200 ${className}`}
      onClick={onClick}
      {...props}
    >
      {/* Icon — no background by default, just the raw icon */}
      <div
        className={`
          w-11 h-11 flex items-center justify-center
          rounded-lg text-text-primary
          ${iconContainerClassName}
        `}
      >
        {icon}
      </div>

      {/* Text */}
      <div>
        <h3 className="text-sm font-bold text-text-primary mb-1.5">
          {title}
        </h3>
        <p className="text-xs leading-relaxed text-text-secondary max-w-xs">
          {description}
        </p>
      </div>
    </div>
  );
};

// ============================================================================
// EXPORTS
// ============================================================================

CourseFeatureCard.displayName = 'CourseFeatureCard';

export default CourseFeatureCard;
