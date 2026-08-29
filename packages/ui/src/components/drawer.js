"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Drawer = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const utils_1 = require("../utils");
const Drawer = ({ isOpen, onClose, children, position = 'right', className, }) => {
    if (!isOpen)
        return null;
    const positions = {
        right: 'right-0 top-0 h-full w-80 max-w-full border-l',
        left: 'left-0 top-0 h-full w-80 max-w-full border-r',
        bottom: 'bottom-0 left-0 w-full max-h-[80vh] border-t rounded-t-2xl',
    };
    return ((0, jsx_runtime_1.jsxs)("div", { className: "fixed inset-0 z-50 bg-black/40 backdrop-blur-xs", children: [(0, jsx_runtime_1.jsx)("div", { className: "fixed inset-0", onClick: onClose }), (0, jsx_runtime_1.jsx)("div", { className: (0, utils_1.cn)('fixed z-50 bg-white p-4 shadow-2xl transition-transform duration-300', positions[position], className), children: children })] }));
};
exports.Drawer = Drawer;
