"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Spinner = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const utils_1 = require("../utils");
const Spinner = ({ size = 'md', className, ...props }) => {
    const sizes = {
        sm: 'h-4 w-4 border-2',
        md: 'h-6 w-6 border-2',
        lg: 'h-8 w-8 border-3',
    };
    return ((0, jsx_runtime_1.jsx)("div", { className: (0, utils_1.cn)('animate-spin rounded-full border-current border-t-transparent text-[#FF5200]', sizes[size], className), ...props }));
};
exports.Spinner = Spinner;
