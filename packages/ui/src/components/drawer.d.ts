import React from 'react';
export interface DrawerProps {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
    position?: 'left' | 'right' | 'bottom';
    className?: string;
}
export declare const Drawer: React.FC<DrawerProps>;
