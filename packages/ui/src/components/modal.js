"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Modal = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const utils_1 = require("../utils");
const Modal = ({ isOpen, onClose, title, children, className }) => {
    if (!isOpen)
        return null;
    return ((0, jsx_runtime_1.jsx)("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm", children: (0, jsx_runtime_1.jsxs)("div", { className: (0, utils_1.cn)('w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl', className), children: [title && ((0, jsx_runtime_1.jsxs)("div", { className: "mb-4 flex items-center justify-between", children: [(0, jsx_runtime_1.jsx)("h3", { className: "text-lg font-bold text-slate-900", children: title }), (0, jsx_runtime_1.jsx)("button", { onClick: onClose, className: "rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600", children: "\u2715" })] })), (0, jsx_runtime_1.jsx)("div", { children: children })] }) }));
};
exports.Modal = Modal;
