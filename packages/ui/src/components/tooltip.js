import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export const Tooltip = ({ content, children }) => {
    return (_jsxs("div", { className: "group relative inline-block", children: [children, _jsx("div", { className: "pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-900 px-2 py-1 text-xs text-white opacity-0 shadow-md transition-opacity group-hover:opacity-100", children: content })] }));
};
