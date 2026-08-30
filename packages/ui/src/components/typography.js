import { jsx as _jsx } from "react/jsx-runtime";
import { cn } from '../utils.js';
export const Typography = ({ variant = 'body', className, children, ...props }) => {
    const styles = {
        h1: 'text-3xl font-extrabold tracking-tight text-slate-900 lg:text-4xl',
        h2: 'text-2xl font-bold tracking-tight text-slate-900',
        h3: 'text-xl font-semibold tracking-tight text-slate-900',
        h4: 'text-lg font-medium text-slate-900',
        body: 'text-sm text-slate-700 leading-relaxed',
        small: 'text-xs font-medium text-slate-600',
        muted: 'text-xs text-slate-500',
    };
    const Component = variant.startsWith('h') ? variant : 'p';
    return (_jsx(Component, { className: cn(styles[variant], className), ...props, children: children }));
};
