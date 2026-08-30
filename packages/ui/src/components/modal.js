import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { cn } from '../utils.js';
export const Modal = ({ isOpen, onClose, title, children, className }) => {
    if (!isOpen)
        return null;
    return (_jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm", children: _jsxs("div", { className: cn('w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl', className), children: [title && (_jsxs("div", { className: "mb-4 flex items-center justify-between", children: [_jsx("h3", { className: "text-lg font-bold text-slate-900", children: title }), _jsx("button", { onClick: onClose, className: "rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600", children: "\u2715" })] })), _jsx("div", { children: children })] }) }));
};
