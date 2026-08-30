import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { cn } from '../utils.js';
export const Drawer = ({ isOpen, onClose, children, position = 'right', className, }) => {
    if (!isOpen)
        return null;
    const positions = {
        right: 'right-0 top-0 h-full w-80 max-w-full border-l',
        left: 'left-0 top-0 h-full w-80 max-w-full border-r',
        bottom: 'bottom-0 left-0 w-full max-h-[80vh] border-t rounded-t-2xl',
    };
    return (_jsxs("div", { className: "fixed inset-0 z-50 bg-black/40 backdrop-blur-xs", children: [_jsx("div", { className: "fixed inset-0", onClick: onClose }), _jsx("div", { className: cn('fixed z-50 bg-white p-4 shadow-2xl transition-transform duration-300', positions[position], className), children: children })] }));
};
