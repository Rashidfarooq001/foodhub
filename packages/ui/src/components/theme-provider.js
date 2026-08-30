'use client';
import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
const ThemeContext = React.createContext(undefined);
export const ThemeProvider = ({ children }) => {
    const [theme, setTheme] = React.useState('light');
    const toggleTheme = () => {
        setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
    };
    return (_jsx(ThemeContext.Provider, { value: { theme, toggleTheme }, children: _jsx("div", { className: theme === 'dark' ? 'dark' : '', children: children }) }));
};
export const useThemeContext = () => {
    const context = React.useContext(ThemeContext);
    if (!context)
        throw new Error('useThemeContext must be used within ThemeProvider');
    return context;
};
