import React from 'react';
import ResourceCard, { ResourceCardProps } from '@/components/molecules/ResourceCard';

export interface ResourceGridProps {
  resources: ResourceCardProps[];
  onAddToCart?: (id: string) => void;
  onShare?: (id: string) => void;
}

export const ResourceGrid: React.FC<ResourceGridProps> = ({
  resources,
  onAddToCart,
  onShare,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-12 py-4">
      {resources.map((resource) => (
        <ResourceCard
          key={resource.id}
          {...resource}
          onAddToCart={() => onAddToCart?.(resource.id)}
          onShare={() => onShare?.(resource.id)}
        />
      ))}
    </div>
  );
};

export default ResourceGrid;
