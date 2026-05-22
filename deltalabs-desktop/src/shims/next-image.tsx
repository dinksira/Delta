/**
 * Next Image Shim
 * Shim to replace next/image in the desktop build environment.
 * Renders a standard img element preserving next/image properties like fill and objectFit.
 *
 * @example
 * ```tsx
 * import Image from 'next/image';
 * <Image src="/logo.png" alt="Logo" width={100} height={100} />
 * ```
 */

import React from 'react';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface ImageProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src' | 'width' | 'height'> {
  src: string | { src: string };
  alt: string;
  width?: number | string;
  height?: number | string;
  fill?: boolean;
  priority?: boolean;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const Image: React.FC<ImageProps> = ({
  src,
  alt,
  width,
  height,
  fill = false,
  priority = false,
  className = '',
  style = {},
  ...props
}) => {
  const resolvedSrc = typeof src === 'object' && src !== null && 'src' in src ? src.src : src;

  const resolvedStyle: React.CSSProperties = fill
    ? {
        position: 'absolute',
        height: '100%',
        width: '100%',
        left: 0,
        top: 0,
        right: 0,
        bottom: 0,
        objectFit: 'cover',
        ...style,
      }
    : { ...style };

  // Suppress warning/unused variable block
  if (priority) {
    // Priority loading can be ignored in local desktop environments
  }

  return (
    <img
      src={resolvedSrc}
      alt={alt}
      width={width}
      height={height}
      className={className}
      style={resolvedStyle}
      {...props}
    />
  );
};

// ============================================================================
// EXPORTS
// ============================================================================

export default Image;
