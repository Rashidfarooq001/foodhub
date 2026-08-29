import React from 'react';
export interface AccordionProps {
    title: string;
    children: React.ReactNode;
    defaultOpen?: boolean;
}
export declare const Accordion: React.FC<AccordionProps>;
