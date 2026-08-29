'use client';
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useThemeContext = exports.ThemeProvider = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = __importDefault(require("react"));
const ThemeContext = react_1.default.createContext(undefined);
const ThemeProvider = ({ children }) => {
    const [theme, setTheme] = react_1.default.useState('light');
    const toggleTheme = () => {
        setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
    };
    return ((0, jsx_runtime_1.jsx)(ThemeContext.Provider, { value: { theme, toggleTheme }, children: (0, jsx_runtime_1.jsx)("div", { className: theme === 'dark' ? 'dark' : '', children: children }) }));
};
exports.ThemeProvider = ThemeProvider;
const useThemeContext = () => {
    const context = react_1.default.useContext(ThemeContext);
    if (!context)
        throw new Error('useThemeContext must be used within ThemeProvider');
    return context;
};
exports.useThemeContext = useThemeContext;
