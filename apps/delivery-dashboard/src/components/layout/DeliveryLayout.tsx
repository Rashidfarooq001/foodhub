'use client';

import React, { useState } from 'react';
import { DeliverySidebar } from './DeliverySidebar';
import { DeliveryHeader } from './DeliveryHeader';

export const DeliveryLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen w-full bg-gray-50/50">
      <DeliverySidebar
        isMobileMenuOpen={isMobileMenuOpen}
        onCloseMobileMenu={() => setIsMobileMenuOpen(false)}
      />
      <div className="flex flex-1 flex-col min-w-0 overflow-x-hidden">
        <DeliveryHeader onOpenMobileMenu={() => setIsMobileMenuOpen(true)} />
        <main className="flex-1 p-3 sm:p-4 md:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
};
