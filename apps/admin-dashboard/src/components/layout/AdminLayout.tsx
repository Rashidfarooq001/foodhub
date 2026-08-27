'use client';

import React, { useState } from 'react';
import { AdminSidebar } from './AdminSidebar';
import { AdminHeader } from './AdminHeader';

export const AdminLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen w-full bg-gray-50/50">
      <AdminSidebar
        isMobileMenuOpen={isMobileMenuOpen}
        onCloseMobileMenu={() => setIsMobileMenuOpen(false)}
      />
      <div className="flex flex-1 flex-col min-w-0">
        <AdminHeader onOpenMobileMenu={() => setIsMobileMenuOpen(true)} />
        <main className="flex-1 w-full mx-auto px-[16px] sm:px-6 pt-4 pb-4 max-w-[1200px] min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
};
