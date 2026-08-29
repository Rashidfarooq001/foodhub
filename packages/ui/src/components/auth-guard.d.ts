import React from 'react';
export interface AuthGuardProps {
    children: React.ReactNode;
    allowedRoles?: string[];
    userRole?: string | null;
    isAuthenticated?: boolean;
    onUnauthorized?: (reason: 'UNAUTHENTICATED' | 'FORBIDDEN') => void;
    /** Optional: absolute URL to the Customer Web portal shown as escape button on 403 screen */
    customerPortalUrl?: string;
}
export declare function AuthGuard({ children, allowedRoles, userRole, isAuthenticated, onUnauthorized, customerPortalUrl, }: AuthGuardProps): React.JSX.Element;
