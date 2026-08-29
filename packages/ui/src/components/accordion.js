"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Accordion = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = __importDefault(require("react"));
const Accordion = ({ title, children, defaultOpen = false }) => {
    const [isOpen, setIsOpen] = react_1.default.useState(defaultOpen);
    return ((0, jsx_runtime_1.jsxs)("div", { className: "border-b border-slate-200 py-3", children: [(0, jsx_runtime_1.jsxs)("button", { onClick: () => setIsOpen(!isOpen), className: "flex w-full items-center justify-between text-left font-semibold text-slate-800", children: [(0, jsx_runtime_1.jsx)("span", { children: title }), (0, jsx_runtime_1.jsx)("span", { className: "text-slate-400", children: isOpen ? '−' : '+' })] }), isOpen && (0, jsx_runtime_1.jsx)("div", { className: "mt-2 text-sm text-slate-600", children: children })] }));
};
exports.Accordion = Accordion;
