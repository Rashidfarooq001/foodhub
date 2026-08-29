import React from 'react';
export interface TabItem {
    id: string;
    label: string;
}
export interface TabsProps {
    tabs: TabItem[];
    activeTab: string;
    onChange: (id: string) => void;
    className?: string;
}
export declare const Tabs: React.FC<TabsProps>;
