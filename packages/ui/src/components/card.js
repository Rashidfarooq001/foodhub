import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
import { cn } from '../utils.js';
export const Card = React.forwardRef(({ className, ...props }, ref) => (_jsx("div", { ref: ref, className: cn('rounded-xl border border-slate-200 bg-white p-4 shadow-sm', className), ...props })));
Card.displayName = 'Card';
