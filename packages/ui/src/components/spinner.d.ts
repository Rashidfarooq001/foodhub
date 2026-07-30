import React from 'react';
export interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
    size?: 'sm' | 'md' | 'lg';
}
export declare const Spinner: React.FC<SpinnerProps>;
