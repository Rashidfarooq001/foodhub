'use client';
import { useEffect, useRef, useCallback } from 'react';
const DEFAULT_TIMEOUT_MS = 24 * 60 * 60 * 1000; // 24 hours
export function useSessionTimeout({ portalName, isAuthenticated, accessToken, logout, apiBaseUrl, loginPath = '/login', timeoutMs = DEFAULT_TIMEOUT_MS, isProtectedPath, }) {
    const timerRef = useRef(null);
    const channelRef = useRef(null);
    const storageKey = `foodhub_session_left_${portalName}`;
    const broadcastChannelName = `foodhub_auth_channel_${portalName}`;
    const logoutTriggerKey = `foodhub_logout_event_${portalName}`;
    const getCurrentPathname = () => {
        if (typeof window !== 'undefined') {
            return window.location.pathname;
        }
        return '';
    };
    // Default path protection checker
    const checkProtected = useCallback((path) => {
        if (isProtectedPath)
            return isProtectedPath(path);
        if (portalName === 'customer') {
            const publicCustomerPaths = ['/login', '/signup', '/forgot-password', '/restaurant/register', '/driver/register'];
            return !publicCustomerPaths.some((p) => path.startsWith(p));
        }
        if (portalName === 'hotel') {
            const publicHotelPaths = ['/login', '/register', '/partner/register', '/forgot-password'];
            return !publicHotelPaths.some((p) => path.startsWith(p));
        }
        if (portalName === 'delivery') {
            const publicDeliveryPaths = ['/login', '/forgot-password'];
            return !publicDeliveryPaths.some((p) => path.startsWith(p));
        }
        if (portalName === 'admin') {
            const publicAdminPaths = ['/login', '/forgot-password'];
            return !publicAdminPaths.some((p) => path.startsWith(p));
        }
        return true;
    }, [portalName, isProtectedPath]);
    // Perform portal logout and redirect to login page with expired flag
    const performAutoLogout = useCallback(async () => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }
        if (typeof window !== 'undefined') {
            localStorage.removeItem(storageKey);
            localStorage.setItem(logoutTriggerKey, Date.now().toString());
            try {
                if (channelRef.current) {
                    channelRef.current.postMessage({ type: 'SESSION_EXPIRED', timestamp: Date.now() });
                }
            }
            catch {
                /* ignore */
            }
        }
        // Invalidate session on backend if token exists
        if (accessToken && apiBaseUrl) {
            try {
                await fetch(`${apiBaseUrl}/auth/logout`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${accessToken}`,
                    },
                }).catch(() => { });
            }
            catch {
                /* ignore */
            }
        }
        logout();
        if (typeof window !== 'undefined') {
            window.location.href = `${loginPath}?expired=true`;
        }
    }, [accessToken, apiBaseUrl, loginPath, logout, storageKey, logoutTriggerKey]);
    // Clean stale keys on mount when authenticated
    useEffect(() => {
        if (typeof window !== 'undefined' && isAuthenticated) {
            localStorage.removeItem(storageKey);
            localStorage.removeItem(logoutTriggerKey);
        }
    }, [isAuthenticated, storageKey, logoutTriggerKey]);
    // Handle return to dashboard / tab focus
    const handleReturn = useCallback(() => {
        if (!isAuthenticated)
            return;
        const currentPath = getCurrentPathname();
        const isCurrentPathProtected = checkProtected(currentPath);
        if (!isCurrentPathProtected)
            return;
        if (typeof window === 'undefined')
            return;
        const leftAtStr = localStorage.getItem(storageKey);
        if (leftAtStr) {
            const leftAt = parseInt(leftAtStr, 10);
            const elapsed = Date.now() - leftAt;
            if (elapsed >= timeoutMs) {
                performAutoLogout();
            }
            else {
                if (timerRef.current) {
                    clearTimeout(timerRef.current);
                    timerRef.current = null;
                }
                localStorage.removeItem(storageKey);
            }
        }
    }, [isAuthenticated, checkProtected, storageKey, timeoutMs, performAutoLogout]);
    // Handle leaving dashboard
    const handleLeave = useCallback(() => {
        if (!isAuthenticated)
            return;
        if (typeof window === 'undefined')
            return;
        const currentPath = getCurrentPathname();
        const isCurrentPathProtected = checkProtected(currentPath);
        if (!isCurrentPathProtected)
            return;
        let leftAt = Date.now();
        const existingLeftAt = localStorage.getItem(storageKey);
        if (!existingLeftAt) {
            localStorage.setItem(storageKey, leftAt.toString());
        }
        else {
            leftAt = parseInt(existingLeftAt, 10);
        }
        const elapsed = Date.now() - leftAt;
        const remaining = Math.max(0, timeoutMs - elapsed);
        if (timerRef.current) {
            clearTimeout(timerRef.current);
        }
        if (remaining <= 0) {
            performAutoLogout();
        }
        else {
            timerRef.current = setTimeout(() => {
                performAutoLogout();
            }, remaining);
        }
    }, [isAuthenticated, checkProtected, storageKey, timeoutMs, performAutoLogout]);
    // 1. Setup BroadcastChannel and localStorage multi-tab listener
    useEffect(() => {
        if (typeof window === 'undefined')
            return;
        if ('BroadcastChannel' in window) {
            const bc = new BroadcastChannel(broadcastChannelName);
            bc.onmessage = (event) => {
                if (event.data?.type === 'SESSION_EXPIRED' && isAuthenticated) {
                    logout();
                    window.location.href = `${loginPath}?expired=true`;
                }
            };
            channelRef.current = bc;
        }
        const handleStorageEvent = (e) => {
            if (e.key === logoutTriggerKey && isAuthenticated) {
                logout();
                window.location.href = `${loginPath}?expired=true`;
            }
        };
        window.addEventListener('storage', handleStorageEvent);
        return () => {
            if (channelRef.current) {
                channelRef.current.close();
                channelRef.current = null;
            }
            window.removeEventListener('storage', handleStorageEvent);
        };
    }, [broadcastChannelName, logoutTriggerKey, isAuthenticated, logout, loginPath]);
    // 2. Track Page Visibility API (hidden = left, visible = return)
    useEffect(() => {
        if (typeof window === 'undefined' || !isAuthenticated)
            return;
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'hidden') {
                handleLeave();
            }
            else if (document.visibilityState === 'visible') {
                handleReturn();
            }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);
        window.addEventListener('pagehide', handleLeave);
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('pagehide', handleLeave);
        };
    }, [isAuthenticated, handleLeave, handleReturn]);
    // 3. In-Page Inactivity Listener
    useEffect(() => {
        if (typeof window === 'undefined' || !isAuthenticated)
            return;
        const currentPath = getCurrentPathname();
        const isProtected = checkProtected(currentPath);
        if (!isProtected)
            return;
        const resetInactivityTimer = () => {
            if (localStorage.getItem(storageKey)) {
                localStorage.removeItem(storageKey);
            }
            if (timerRef.current) {
                clearTimeout(timerRef.current);
            }
            timerRef.current = setTimeout(() => {
                performAutoLogout();
            }, timeoutMs);
        };
        resetInactivityTimer();
        let activityThrottleTimer = null;
        const handleUserActivity = () => {
            if (activityThrottleTimer)
                return;
            activityThrottleTimer = setTimeout(() => {
                activityThrottleTimer = null;
                resetInactivityTimer();
            }, 5000);
        };
        window.addEventListener('mousemove', handleUserActivity);
        window.addEventListener('mousedown', handleUserActivity);
        window.addEventListener('keydown', handleUserActivity);
        window.addEventListener('touchstart', handleUserActivity);
        window.addEventListener('scroll', handleUserActivity);
        return () => {
            if (activityThrottleTimer)
                clearTimeout(activityThrottleTimer);
            if (timerRef.current) {
                clearTimeout(timerRef.current);
                timerRef.current = null;
            }
            window.removeEventListener('mousemove', handleUserActivity);
            window.removeEventListener('mousedown', handleUserActivity);
            window.removeEventListener('keydown', handleUserActivity);
            window.removeEventListener('touchstart', handleUserActivity);
            window.removeEventListener('scroll', handleUserActivity);
        };
    }, [isAuthenticated, checkProtected, storageKey, timeoutMs, performAutoLogout]);
    return {
        performAutoLogout,
    };
}
