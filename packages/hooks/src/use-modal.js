"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useModal = useModal;
const react_1 = require("react");
function useModal(initialState = false) {
    const [isOpen, setIsOpen] = (0, react_1.useState)(initialState);
    const open = () => setIsOpen(true);
    const close = () => setIsOpen(false);
    const toggle = () => setIsOpen((prev) => !prev);
    return { isOpen, open, close, toggle };
}
