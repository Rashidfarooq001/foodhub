'use client';
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
export function AuthGuard({ children, allowedRoles, userRole, isAuthenticated, onUnauthorized, customerPortalUrl, }) {
    const [mounted, setMounted] = useState(false);
    useEffect(() => {
        setMounted(true);
    }, []);
    const normalizedUserRole = (userRole || 'CUSTOMER').toUpperCase().trim();
    const normalizedAllowedRoles = allowedRoles?.map((r) => r.toUpperCase().trim());
    const isForbidden = Boolean(normalizedAllowedRoles && normalizedAllowedRoles.length > 0) &&
        Boolean(userRole) &&
        !normalizedAllowedRoles?.includes(normalizedUserRole);
    useEffect(() => {
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
        return (_jsx("div", { className: "flex min-h-[50vh] items-center justify-center p-8", children: _jsx("div", { className: "h-8 w-8 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" }) }));
    }
    if (!isAuthenticated) {
        return (_jsxs("div", { className: "flex min-h-[60vh] flex-col items-center justify-center space-y-4 p-8 text-center", children: [_jsx("h2", { className: "text-2xl font-bold text-gray-900", children: "Authentication Required" }), _jsx("p", { className: "text-sm text-gray-500", children: "Please log in to access this page." }), _jsx("a", { href: "/login", className: "rounded-xl bg-orange-600 px-6 py-2.5 text-sm font-bold text-white shadow-lg hover:bg-orange-700", children: "Go to Login" })] }));
    }
    if (isForbidden) {
        return (_jsxs("div", { className: "flex min-h-[60vh] flex-col items-center justify-center space-y-4 p-8 text-center", children: [_jsx("div", { className: "rounded-full bg-rose-100 p-4 text-rose-600 font-black text-2xl", children: "403" }), _jsx("h2", { className: "text-2xl font-bold text-gray-900", children: "Access Denied (403 Forbidden)" }), _jsx("p", { className: "text-sm text-gray-500", children: "You do not have permission to view this page." }), _jsxs("div", { className: "flex flex-col items-center gap-3 sm:flex-row", children: [_jsx("a", { href: "/", className: "rounded-xl bg-gray-900 px-6 py-2.5 text-sm font-bold text-white shadow-lg hover:bg-gray-800", children: "Return to Home" }), customerPortalUrl && (_jsx("a", { href: customerPortalUrl, className: "rounded-xl border border-orange-500 bg-white px-6 py-2.5 text-sm font-bold text-orange-600 shadow-lg hover:bg-orange-50", children: "Go to Customer Portal" }))] })] }));
    }
    return _jsx(_Fragment, { children: children });
}
