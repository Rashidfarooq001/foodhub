import React from 'react';
export interface TypographyProps extends React.HTMLAttributes<HTMLHeadingElement> {
    variant?: 'h1' | 'h2' | 'h3' | 'h4' | 'body' | 'small' | 'muted';
}
export declare const Typography: React.FC<TypographyProps>;
