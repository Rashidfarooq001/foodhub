import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
export const Accordion = ({ title, children, defaultOpen = false }) => {
    const [isOpen, setIsOpen] = React.useState(defaultOpen);
    return (_jsxs("div", { className: "border-b border-slate-200 py-3", children: [_jsxs("button", { onClick: () => setIsOpen(!isOpen), className: "flex w-full items-center justify-between text-left font-semibold text-slate-800", children: [_jsx("span", { children: title }), _jsx("span", { className: "text-slate-400", children: isOpen ? '−' : '+' })] }), isOpen && _jsx("div", { className: "mt-2 text-sm text-slate-600", children: children })] }));
};
