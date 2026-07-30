import React from 'react';
import { cn } from '../utils';

export interface TypographyProps extends React.HTMLAttributes<HTMLHeadingElement> {
  variant?: 'h1' | 'h2' | 'h3' | 'h4' | 'body' | 'small' | 'muted';
}

export const Typography: React.FC<TypographyProps> = ({
  variant = 'body',
  className,
  children,
  ...props
}) => {
  const styles = {
    h1: 'text-3xl font-extrabold tracking-tight text-slate-900 lg:text-4xl',
    h2: 'text-2xl font-bold tracking-tight text-slate-900',
    h3: 'text-xl font-semibold tracking-tight text-slate-900',
    h4: 'text-lg font-medium text-slate-900',
    body: 'text-sm text-slate-700 leading-relaxed',
    small: 'text-xs font-medium text-slate-600',
    muted: 'text-xs text-slate-500',
  };

  const Component = variant.startsWith('h') ? (variant as 'h1' | 'h2' | 'h3' | 'h4') : 'p';

  return (
    <Component className={cn(styles[variant], className)} {...props}>
      {children}
    </Component>
  );
};
