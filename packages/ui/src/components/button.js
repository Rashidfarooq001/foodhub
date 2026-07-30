"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Button = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = __importDefault(require("react"));
const utils_1 = require("../utils");
exports.Button = react_1.default.forwardRef(({ className, variant = 'primary', size = 'md', isLoading, children, disabled, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 rounded-xl';
    const variants = {
        primary: 'bg-[#FF5200] text-white hover:bg-[#E04800] focus-visible:ring-[#FF5200]',
        secondary: 'bg-[#00C853] text-white hover:bg-[#00A844] focus-visible:ring-[#00C853]',
        outline: 'border border-slate-300 bg-transparent text-slate-900 hover:bg-slate-100',
        ghost: 'bg-transparent text-slate-700 hover:bg-slate-100',
        destructive: 'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-600',
    };
    const sizes = {
        sm: 'h-8 px-3 text-xs',
        md: 'h-10 px-4 text-sm',
        lg: 'h-12 px-6 text-base',
    };
    return ((0, jsx_runtime_1.jsxs)("button", { ref: ref, disabled: disabled || isLoading, className: (0, utils_1.cn)(baseStyles, variants[variant], sizes[size], className), ...props, children: [isLoading ? ((0, jsx_runtime_1.jsx)("span", { className: "mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" })) : null, children] }));
});
exports.Button.displayName = 'Button';
