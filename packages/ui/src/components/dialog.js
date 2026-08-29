"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Dialog = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const modal_1 = require("./modal");
const Dialog = (props) => {
    return (0, jsx_runtime_1.jsx)(modal_1.Modal, { ...props });
};
exports.Dialog = Dialog;
