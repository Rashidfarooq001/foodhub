import { jsx as _jsx } from "react/jsx-runtime";
import { cn } from '../utils.js';
export const Tabs = ({ tabs, activeTab, onChange, className }) => {
    return (_jsx("div", { className: cn('flex space-x-1 border-b border-slate-200', className), children: tabs.map((tab) => (_jsx("button", { onClick: () => onChange(tab.id), className: cn('px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px', activeTab === tab.id
                ? 'border-[#FF5200] text-[#FF5200]'
                : 'border-transparent text-slate-500 hover:text-slate-700'), children: tab.label }, tab.id))) }));
};
