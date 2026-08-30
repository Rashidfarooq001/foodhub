import React from 'react';
import { cn } from '../utils.js';

export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  position?: 'left' | 'right' | 'bottom';
  className?: string;
}

export const Drawer: React.FC<DrawerProps> = ({
  isOpen,
  onClose,
  children,
  position = 'right',
  className,
}) => {
  if (!isOpen) return null;

  const positions = {
    right: 'right-0 top-0 h-full w-80 max-w-full border-l',
    left: 'left-0 top-0 h-full w-80 max-w-full border-r',
    bottom: 'bottom-0 left-0 w-full max-h-[80vh] border-t rounded-t-2xl',
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs">
      <div className="fixed inset-0" onClick={onClose} />
      <div
        className={cn(
          'fixed z-50 bg-white p-4 shadow-2xl transition-transform duration-300',
          positions[position],
          className,
        )}
      >
        {children}
      </div>
    </div>
  );
};
