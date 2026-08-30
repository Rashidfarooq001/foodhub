import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { cn } from '../utils.js';
export const Input = React.forwardRef(({ className, type = 'text', error, label, ...props }, ref) => {
    return (_jsxs("div", { className: "w-full", children: [label && (_jsx("label", { className: "mb-1 block text-xs font-medium text-slate-700", children: label })), _jsx("input", { type: type, ref: ref, className: cn('flex h-10 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5200] disabled:cursor-not-allowed disabled:opacity-50', error && 'border-red-500 focus-visible:ring-red-500', className), ...props }), error && _jsx("p", { className: "mt-1 text-xs text-red-500", children: error })] }));
});
Input.displayName = 'Input';
