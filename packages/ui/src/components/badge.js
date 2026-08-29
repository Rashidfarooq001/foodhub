"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Badge = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const utils_1 = require("../utils");
const Badge = ({ className, variant = 'default', children, ...props }) => {
    const variants = {
        default: 'bg-orange-100 text-[#FF5200]',
        success: 'bg-emerald-100 text-emerald-800',
        warning: 'bg-amber-100 text-amber-800',
        error: 'bg-red-100 text-red-800',
        outline: 'border border-slate-300 text-slate-700',
    };
    return ((0, jsx_runtime_1.jsx)("span", { className: (0, utils_1.cn)('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold', variants[variant], className), ...props, children: children }));
};
exports.Badge = Badge;
