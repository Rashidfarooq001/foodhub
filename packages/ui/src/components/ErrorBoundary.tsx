'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in component:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center bg-gray-50 rounded-3xl border border-gray-100 m-4 shadow-sm">
          <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mb-6">
            <AlertTriangle size={32} />
          </div>
          <h2 className="text-2xl font-black text-gray-900 mb-2">Something went wrong</h2>
          <p className="text-gray-500 max-w-md mb-8">
            {this.state.error?.message || "An unexpected error occurred while loading this section. Please try again."}
          </p>
          <button
            onClick={this.handleReset}
            className="flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl transition shadow-sm"
          >
            <RefreshCw size={18} />
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
