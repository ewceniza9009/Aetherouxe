import { useState } from 'react';
import { cn } from '@/lib/utils';

interface AvatarProps {
  src?: string | null;
  alt?: string;
  fallback?: React.ReactNode;
  className?: string;
  rounded?: 'md' | 'lg' | 'full';
}

const roundedMap = {
  md: 'rounded-md',
  lg: 'rounded-lg',
  full: 'rounded-full',
} as const;

export function Avatar({ src, alt, fallback, className, rounded = 'md' }: AvatarProps) {
  const [errored, setErrored] = useState(false);
  const showImage = src && !errored;

  return (
    <div
      className={cn(
        'relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden bg-primary/10 text-primary',
        roundedMap[rounded],
        className,
      )}
    >
      {showImage ? (
        <img
          src={src}
          alt={alt ?? ''}
          className="h-full w-full object-cover"
          onError={() => setErrored(true)}
        />
      ) : (
        (fallback ?? null)
      )}
    </div>
  );
}
