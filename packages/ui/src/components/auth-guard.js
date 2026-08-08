'use client';
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthGuard = AuthGuard;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("react");
function AuthGuard({ children, allowedRoles, userRole, isAuthenticated, onUnauthorized, }) {
    const [mounted, setMounted] = (0, react_1.useState)(false);
    (0, react_1.useEffect)(() => {
        setMounted(true);
    }, []);
    const normalizedUserRole = (userRole || 'CUSTOMER').toUpperCase().trim();
    const normalizedAllowedRoles = allowedRoles?.map((r) => r.toUpperCase().trim());
    const isForbidden = Boolean(normalizedAllowedRoles && normalizedAllowedRoles.length > 0) &&
        Boolean(userRole) &&
        !normalizedAllowedRoles?.includes(normalizedUserRole);
    (0, react_1.useEffect)(() => {
        if (!mounted)
            return;
        if (!isAuthenticated) {
            onUnauthorized?.('UNAUTHENTICATED');
            return;
        }
        if (isForbidden) {
            onUnauthorized?.('FORBIDDEN');
        }
    }, [mounted, isAuthenticated, isForbidden, onUnauthorized]);
    if (!mounted) {
        return ((0, jsx_runtime_1.jsx)("div", { className: "flex min-h-[50vh] items-center justify-center p-8", children: (0, jsx_runtime_1.jsx)("div", { className: "h-8 w-8 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" }) }));
    }
    if (!isAuthenticated) {
        return ((0, jsx_runtime_1.jsxs)("div", { className: "flex min-h-[60vh] flex-col items-center justify-center space-y-4 p-8 text-center", children: [(0, jsx_runtime_1.jsx)("h2", { className: "text-2xl font-bold text-gray-900", children: "Authentication Required" }), (0, jsx_runtime_1.jsx)("p", { className: "text-sm text-gray-500", children: "Please log in to access this page." }), (0, jsx_runtime_1.jsx)("a", { href: "/login", className: "rounded-xl bg-orange-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg hover:bg-orange-700", children: "Go to Login" })] }));
    }
    if (isForbidden) {
        return ((0, jsx_runtime_1.jsxs)("div", { className: "flex min-h-[60vh] flex-col items-center justify-center space-y-4 p-8 text-center", children: [(0, jsx_runtime_1.jsx)("div", { className: "rounded-full bg-rose-100 p-4 text-rose-600 font-black text-2xl", children: "403" }), (0, jsx_runtime_1.jsx)("h2", { className: "text-2xl font-bold text-gray-900", children: "Access Denied (403 Forbidden)" }), (0, jsx_runtime_1.jsx)("p", { className: "text-sm text-gray-500", children: "You do not have permission to view this page." }), (0, jsx_runtime_1.jsx)("a", { href: "/", className: "rounded-xl bg-gray-900 px-6 py-2.5 text-sm font-bold text-white shadow-lg hover:bg-gray-800", children: "Return to Home" })] }));
    }
    return (0, jsx_runtime_1.jsx)(jsx_runtime_1.Fragment, { children: children });
}
