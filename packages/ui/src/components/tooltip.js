"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Tooltip = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const Tooltip = ({ content, children }) => {
    return ((0, jsx_runtime_1.jsxs)("div", { className: "group relative inline-block", children: [children, (0, jsx_runtime_1.jsx)("div", { className: "pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-900 px-2 py-1 text-xs text-white opacity-0 shadow-md transition-opacity group-hover:opacity-100", children: content })] }));
};
exports.Tooltip = Tooltip;
