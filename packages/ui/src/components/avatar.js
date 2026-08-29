"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Avatar = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = __importDefault(require("react"));
const utils_1 = require("../utils");
const Avatar = ({ src, alt, fallback, className, ...props }) => {
    const [hasError, setHasError] = react_1.default.useState(false);
    return ((0, jsx_runtime_1.jsx)("div", { className: (0, utils_1.cn)('relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full bg-slate-200 text-sm font-semibold text-slate-700 items-center justify-center', className), ...props, children: src && !hasError ? ((0, jsx_runtime_1.jsx)("img", { src: src, alt: alt || 'Avatar', onError: () => setHasError(true), className: "h-full w-full object-cover" })) : ((0, jsx_runtime_1.jsx)("span", { children: fallback || 'FH' })) }));
};
exports.Avatar = Avatar;
