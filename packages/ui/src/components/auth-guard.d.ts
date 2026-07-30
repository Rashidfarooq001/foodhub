import React from 'react';
export interface AuthGuardProps {
    children: React.ReactNode;
    allowedRoles?: string[];
    userRole?: string | null;
    isAuthenticated?: boolean;
    onUnauthorized?: (reason: 'UNAUTHENTICATED' | 'FORBIDDEN') => void;
}
export declare function AuthGuard({ children, allowedRoles, userRole, isAuthenticated, onUnauthorized, }: AuthGuardProps): React.JSX.Element;
