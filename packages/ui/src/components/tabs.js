"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Tabs = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const utils_1 = require("../utils");
const Tabs = ({ tabs, activeTab, onChange, className }) => {
    return ((0, jsx_runtime_1.jsx)("div", { className: (0, utils_1.cn)('flex space-x-1 border-b border-slate-200', className), children: tabs.map((tab) => ((0, jsx_runtime_1.jsx)("button", { onClick: () => onChange(tab.id), className: (0, utils_1.cn)('px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px', activeTab === tab.id
                ? 'border-[#FF5200] text-[#FF5200]'
                : 'border-transparent text-slate-500 hover:text-slate-700'), children: tab.label }, tab.id))) }));
};
exports.Tabs = Tabs;
