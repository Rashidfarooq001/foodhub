"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useDisclosure = useDisclosure;
const react_1 = require("react");
function useDisclosure(initialState = false) {
    const [isOpen, setIsOpen] = (0, react_1.useState)(initialState);
    const onOpen = () => setIsOpen(true);
    const onClose = () => setIsOpen(false);
    const onToggle = () => setIsOpen((prev) => !prev);
    return { isOpen, onOpen, onClose, onToggle };
}
