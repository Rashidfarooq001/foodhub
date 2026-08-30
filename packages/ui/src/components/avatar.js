import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
import { cn } from '../utils.js';
export const Avatar = ({ src, alt, fallback, className, ...props }) => {
    const [hasError, setHasError] = React.useState(false);
    return (_jsx("div", { className: cn('relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full bg-slate-200 text-sm font-semibold text-slate-700 items-center justify-center', className), ...props, children: src && !hasError ? (_jsx("img", { src: src, alt: alt || 'Avatar', onError: () => setHasError(true), className: "h-full w-full object-cover" })) : (_jsx("span", { children: fallback || 'FH' })) }));
};
