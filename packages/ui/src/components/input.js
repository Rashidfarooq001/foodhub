"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Input = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = __importDefault(require("react"));
const utils_1 = require("../utils");
exports.Input = react_1.default.forwardRef(({ className, type = 'text', error, label, ...props }, ref) => {
    return ((0, jsx_runtime_1.jsxs)("div", { className: "w-full", children: [label && ((0, jsx_runtime_1.jsx)("label", { className: "mb-1 block text-xs font-medium text-slate-700", children: label })), (0, jsx_runtime_1.jsx)("input", { type: type, ref: ref, className: (0, utils_1.cn)('flex h-10 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5200] disabled:cursor-not-allowed disabled:opacity-50', error && 'border-red-500 focus-visible:ring-red-500', className), ...props }), error && (0, jsx_runtime_1.jsx)("p", { className: "mt-1 text-xs text-red-500", children: error })] }));
});
exports.Input.displayName = 'Input';
