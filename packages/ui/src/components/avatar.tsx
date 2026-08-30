import React from 'react';
import { cn } from '../utils.js';

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string;
  alt?: string;
  fallback?: string;
}

export const Avatar: React.FC<AvatarProps> = ({ src, alt, fallback, className, ...props }) => {
  const [hasError, setHasError] = React.useState(false);

  return (
    <div
      className={cn(
        'relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full bg-slate-200 text-sm font-semibold text-slate-700 items-center justify-center',
        className,
      )}
      {...props}
    >
      {src && !hasError ? (
        <img
          src={src}
          alt={alt || 'Avatar'}
          onError={() => setHasError(true)}
          className="h-full w-full object-cover"
        />
      ) : (
        <span>{fallback || 'FH'}</span>
      )}
    </div>
  );
};
