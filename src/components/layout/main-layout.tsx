'use client';

import React, { useState } from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from './sidebar';
import { Header } from './header';

export function MainLayout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  // Standalone pages (Landing page, Login, Signup pages) render full-bleed without CRM sidebar/header
  if (
    pathname === '/' ||
    pathname === '/landing' ||
    pathname === '/login' ||
    pathname === '/signup' ||
    pathname === '/signin' ||
    pathname === '/register'
  ) {
    return <div className="min-h-screen w-full bg-[#0B0F1A] text-[#F5F5F7] antialiased">{children}</div>;
  }

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[#F8FAFC] via-[#F1F5F9]/60 to-[#EFF6FF]/40 text-[#0F172A] flex flex-col antialiased">
      <div className="flex-1 flex w-full min-w-0 overflow-hidden">
        <Sidebar
          mobileOpen={mobileOpen}
          onMobileClose={() => setMobileOpen(false)}
        />
        <div className="flex-1 flex flex-col min-w-0 w-full overflow-y-auto">
          <Header
            onMobileMenuToggle={() => setMobileOpen((prev) => !prev)}
          />
          <main className="flex-1 p-4 sm:p-6 lg:p-6 2xl:p-8 max-w-[1536px] w-full mx-auto space-y-6 box-border min-w-0 overflow-x-hidden">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
