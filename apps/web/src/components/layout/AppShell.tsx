'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { AuthProvider } from '../../context/AuthContext';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname === '/login' || pathname === '/register';

  return (
    <AuthProvider>
      {isAuthPage ? (
        <div className="w-full min-h-screen bg-[#F2F2F7]">{children}</div>
      ) : (
        <div className="flex min-h-screen w-full bg-[#F2F2F7] text-[#1C1C1E] antialiased">
          <Sidebar />
          <div className="flex-1 flex flex-col min-w-0">
            <Header />
            <main className="flex-1 overflow-y-auto">{children}</main>
          </div>
        </div>
      )}
    </AuthProvider>
  );
}
