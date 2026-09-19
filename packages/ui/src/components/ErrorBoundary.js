'use client';
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Component } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
export class ErrorBoundary extends Component {
    state = {
        hasError: false,
        error: null,
    };
    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }
    componentDidCatch(error, errorInfo) {
        console.error('Uncaught error in component:', error, errorInfo);
    }
    handleReset = () => {
        this.setState({ hasError: false, error: null });
        window.location.reload();
    };
    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }
            return (_jsxs("div", { className: "flex flex-col items-center justify-center min-h-[400px] p-8 text-center bg-gray-50 rounded-3xl border border-gray-100 m-4 shadow-sm", children: [_jsx("div", { className: "w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mb-6", children: _jsx(AlertTriangle, { size: 32 }) }), _jsx("h2", { className: "text-2xl font-black text-gray-900 mb-2", children: "Something went wrong" }), _jsx("p", { className: "text-gray-500 max-w-md mb-8", children: this.state.error?.message || "An unexpected error occurred while loading this section. Please try again." }), _jsxs("button", { onClick: this.handleReset, className: "flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl transition shadow-sm", children: [_jsx(RefreshCw, { size: 18 }), "Try Again"] })] }));
        }
        return this.props.children;
    }
}
